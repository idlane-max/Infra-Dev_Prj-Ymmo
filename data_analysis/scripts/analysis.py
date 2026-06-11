"""
data_analysis/scripts/analysis.py
==================================
Script d'analyse de données Ymmo avec Pandas.
Génère des rapports de ventes, analyses statistiques et prévisions.

Usage :
    cd backend
    python ../data_analysis/scripts/analysis.py

Sorties :
    data_analysis/reports/rapport_ventes.csv
    data_analysis/reports/previsions_ventes.csv
    data_analysis/reports/zones_interessantes.csv
    data_analysis/reports/summary_stats.txt
"""

import sys
import os
import warnings
warnings.filterwarnings("ignore")

# Permettre l'import des modules backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

import pandas as pd
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session

# --- Imports backend ---
from app.core.database import SessionLocal
from app.models.core_models import (
    Property, Transaction, User, Agency, Role,
    PropertyStatus, PropertyType, TransactionMode
)

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "../reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


def load_data(db: Session):
    """Charge toutes les données depuis PostgreSQL en DataFrames Pandas."""
    print("📦 Chargement des données...")

    # Propriétés
    props = db.query(Property).all()
    df_props = pd.DataFrame([{
        "id": p.id,
        "title": p.title,
        "city": p.city,
        "price": p.price,
        "area": p.area,
        "type": p.type.value,
        "status": p.status.value,
        "transaction_mode": p.transaction_mode.value,
        "agent_id": p.agent_id,
        "created_at": p.created_at,
    } for p in props]) if props else pd.DataFrame()

    # Transactions
    txns = db.query(Transaction).all()
    df_txns = pd.DataFrame([{
        "id": t.id,
        "property_id": t.property_id,
        "buyer_id": t.buyer_id,
        "agent_id": t.agent_id,
        "price_sold": t.price_sold,
        "transaction_date": t.transaction_date,
    } for t in txns]) if txns else pd.DataFrame()

    # Agents + Agences
    users = db.query(User).join(Role).filter(Role.name.in_(["Direction", "Commercial"])).all()
    df_users = pd.DataFrame([{
        "id": u.id,
        "email": u.email,
        "agency_id": u.agency_id,
        "agency_name": u.agency.name if u.agency else "N/A",
        "city": u.agency.city if u.agency else "N/A",
    } for u in users]) if users else pd.DataFrame()

    print(f"  ✓ {len(df_props)} biens, {len(df_txns)} transactions, {len(df_users)} agents")
    return df_props, df_txns, df_users


def rapport_ventes(df_props: pd.DataFrame, df_txns: pd.DataFrame, df_users: pd.DataFrame):
    """
    Rapport complet des ventes :
    - CA par mois
    - Prix moyen de vente
    - Délai moyen de vente
    """
    print("\n📊 Génération du rapport de ventes...")

    if df_txns.empty or df_props.empty:
        print("  ⚠️  Pas de données de transactions.")
        return

    df_txns["transaction_date"] = pd.to_datetime(df_txns["transaction_date"])

    # Joindre avec les propriétés pour avoir la ville, le type, la date de création
    df = df_txns.merge(
        df_props[["id", "city", "type", "price", "area", "created_at", "agent_id"]],
        left_on="property_id", right_on="id", how="left"
    )
    df["created_at"] = pd.to_datetime(df["created_at"])
    df["delai_vente_jours"] = (df["transaction_date"] - df["created_at"]).dt.days

    # Joindre avec les agents pour avoir l'agence
    if not df_users.empty:
        df = df.merge(df_users[["id", "agency_name"]], left_on="agent_id", right_on="id", how="left")

    # CA mensuel
    df["mois"] = df["transaction_date"].dt.to_period("M")
    ca_mensuel = df.groupby("mois").agg(
        nb_ventes=("price_sold", "count"),
        ca_total=("price_sold", "sum"),
        prix_moyen_vente=("price_sold", "mean"),
        delai_moyen_jours=("delai_vente_jours", "mean"),
    ).reset_index()
    ca_mensuel["mois"] = ca_mensuel["mois"].astype(str)
    ca_mensuel = ca_mensuel.round(2)

    output_path = os.path.join(REPORTS_DIR, "rapport_ventes_mensuel.csv")
    ca_mensuel.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"  ✓ Rapport mensuel sauvegardé → {output_path}")

    # Stats globales
    print(f"\n  📈 Stats globales :")
    print(f"     CA Total       : {df['price_sold'].sum():>15,.0f} €")
    print(f"     Nb Transactions: {len(df):>15,}")
    print(f"     Prix moyen     : {df['price_sold'].mean():>15,.0f} €")
    print(f"     Délai moyen    : {df['delai_vente_jours'].mean():>15.0f} jours")

    return ca_mensuel


def analyse_zones(df_props: pd.DataFrame, df_txns: pd.DataFrame):
    """
    Analyse des zones géographiques :
    - Taux de vente par ville
    - Prix au m² moyen
    - Score d'attractivité
    - Identification des zones 'chaudes'
    """
    print("\n🗺️  Analyse des zones géographiques...")

    if df_props.empty:
        print("  ⚠️  Pas de données de biens.")
        return

    df_props["prix_m2"] = df_props["price"] / df_props["area"]

    stats_ville = df_props.groupby("city").agg(
        total_biens=("id", "count"),
        biens_disponibles=("status", lambda x: (x == "available").sum()),
        biens_vendus=("status", lambda x: (x == "sold").sum()),
        prix_moyen=("price", "mean"),
        prix_m2_moyen=("prix_m2", "mean"),
        surface_moyenne=("area", "mean"),
    ).reset_index()

    # CA par ville via transactions
    if not df_txns.empty:
        df_txns_city = df_txns.merge(
            df_props[["id", "city"]], left_on="property_id", right_on="id", how="left"
        )
        ca_city = df_txns_city.groupby("city")["price_sold"].sum().reset_index()
        ca_city.columns = ["city", "ca_total"]
        stats_ville = stats_ville.merge(ca_city, on="city", how="left").fillna(0)
    else:
        stats_ville["ca_total"] = 0

    # Taux de vente
    stats_ville["taux_vente_pct"] = (
        stats_ville["biens_vendus"] / stats_ville["total_biens"] * 100
    ).round(1)

    # Score d'attractivité (0-100) combinant taux de vente + volume de CA
    stats_ville["score_attractivite"] = (
        (stats_ville["taux_vente_pct"] / stats_ville["taux_vente_pct"].max() * 60) +
        (stats_ville["ca_total"] / stats_ville["ca_total"].max() * 40)
    ).round(0).astype(int) if stats_ville["taux_vente_pct"].max() > 0 else 0

    # Classifier les zones
    q75 = stats_ville["score_attractivite"].quantile(0.75)
    q25 = stats_ville["score_attractivite"].quantile(0.25)
    stats_ville["zone"] = stats_ville["score_attractivite"].apply(
        lambda s: "🔥 Chaude" if s >= q75 else ("❄️ Froide" if s <= q25 else "⚖️ Neutre")
    )

    stats_ville = stats_ville.sort_values("score_attractivite", ascending=False)
    stats_ville = stats_ville.round(2)

    output_path = os.path.join(REPORTS_DIR, "zones_interessantes.csv")
    stats_ville.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"  ✓ Analyse zones sauvegardée → {output_path}")

    print(f"\n  🔥 Top 3 zones chaudes :")
    for _, row in stats_ville.head(3).iterrows():
        print(f"     {row['city']:<25} | Score: {row['score_attractivite']:3d} | CA: {row['ca_total']:>12,.0f} €")

    return stats_ville


def previsions_ventes(df_txns: pd.DataFrame):
    """
    Prévision des ventes pour les 3 prochains mois.
    Utilise une régression linéaire simple sur les données historiques.
    """
    print("\n🔮 Calcul des prévisions de ventes...")

    if df_txns.empty or len(df_txns) < 6:
        print("  ⚠️  Pas assez de données pour faire des prévisions.")
        return

    df_txns["transaction_date"] = pd.to_datetime(df_txns["transaction_date"])
    df_txns["mois"] = df_txns["transaction_date"].dt.to_period("M")

    monthly = df_txns.groupby("mois").agg(
        nb_ventes=("price_sold", "count"),
        ca=("price_sold", "sum"),
    ).reset_index()
    monthly = monthly.sort_values("mois")

    # Régression linéaire sur le CA
    x = np.arange(len(monthly))
    y_ca = monthly["ca"].values
    y_nb = monthly["nb_ventes"].values

    coeff_ca = np.polyfit(x, y_ca, 1)
    coeff_nb = np.polyfit(x, y_nb, 1)

    # 3 prochains mois
    last_period = monthly["mois"].iloc[-1]
    previsions = []
    for i in range(1, 4):
        idx = len(monthly) + i - 1
        next_period = last_period + i
        previsions.append({
            "mois": str(next_period),
            "ca_prevu": max(0, round(coeff_ca[0] * idx + coeff_ca[1], 2)),
            "nb_ventes_prevu": max(0, round(coeff_nb[0] * idx + coeff_nb[1], 0)),
            "type": "prévision",
        })

    df_prev = pd.DataFrame(previsions)
    output_path = os.path.join(REPORTS_DIR, "previsions_ventes.csv")
    df_prev.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"  ✓ Prévisions sauvegardées → {output_path}")

    print(f"\n  📅 Prévisions pour les 3 prochains mois :")
    for _, row in df_prev.iterrows():
        print(f"     {row['mois']} | CA prévu : {row['ca_prevu']:>12,.0f} € | Ventes prévues : {row['nb_ventes_prevu']:.0f}")

    return df_prev


def summary_report(df_props, df_txns, zones, previsions):
    """Génère un fichier texte récapitulatif."""
    lines = [
        "=" * 60,
        "  RAPPORT ANALYTIQUE YMMO",
        f"  Généré le : {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
        "=" * 60,
        "",
        f"PORTEFEUILLE IMMOBILIER",
        f"  Total biens        : {len(df_props):,}",
        f"  Disponibles        : {(df_props['status'] == 'available').sum():,}" if not df_props.empty else "",
        f"  Vendus             : {(df_props['status'] == 'sold').sum():,}" if not df_props.empty else "",
        f"  En cours           : {(df_props['status'] == 'under_offer').sum():,}" if not df_props.empty else "",
        "",
        f"TRANSACTIONS",
        f"  Total transactions : {len(df_txns):,}",
        f"  CA Total           : {df_txns['price_sold'].sum():,.0f} €" if not df_txns.empty else "  CA Total : N/A",
        f"  Prix moyen vente   : {df_txns['price_sold'].mean():,.0f} €" if not df_txns.empty else "",
        "",
    ]

    if zones is not None and not zones.empty:
        lines += ["TOP 5 ZONES PAR ATTRACTIVITÉ", "-" * 40]
        for _, row in zones.head(5).iterrows():
            lines.append(f"  {row['city']:<20} {row['zone']} | Score: {row['score_attractivite']}")
        lines.append("")

    if previsions is not None and not previsions.empty:
        lines += ["PRÉVISIONS (3 prochains mois)", "-" * 40]
        for _, row in previsions.iterrows():
            lines.append(f"  {row['mois']} → CA prévu : {row['ca_prevu']:>12,.0f} €")
        lines.append("")

    lines.append("=" * 60)

    output_path = os.path.join(REPORTS_DIR, "summary_stats.txt")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"\n📝 Rapport résumé sauvegardé → {output_path}")
    print("\n".join(lines))


def main():
    print("🏢 YMMO — Analyse de données avec Pandas")
    print("=" * 50)

    db = SessionLocal()
    try:
        df_props, df_txns, df_users = load_data(db)

        if df_props.empty:
            print("\n⚠️  La base de données est vide. Lance d'abord : python generate_data.py")
            return

        ventes = rapport_ventes(df_props, df_txns, df_users)
        zones = analyse_zones(df_props, df_txns)
        previsions = previsions_ventes(df_txns)
        summary_report(df_props, df_txns, zones, previsions)

        print("\n✅ Analyse terminée ! Rapports disponibles dans data_analysis/reports/")
    finally:
        db.close()


if __name__ == "__main__":
    main()
