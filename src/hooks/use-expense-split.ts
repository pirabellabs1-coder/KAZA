"use client";

import { useMemo } from "react";

export interface Expense {
  id: string;
  payerId: string;
  amount: number;
  participants: string[]; // user IDs qui consomment
}

export interface Balance {
  userId: string;
  net: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface UseExpenseSplitResult {
  balances: Balance[];
  settlements: Settlement[];
}

/**
 * Calcule la balance nette de chaque colocataire à partir d'une liste de
 * dépenses et propose un ensemble minimal de transferts pour solder les
 * comptes.
 *
 * Règle de calcul :
 *  - le payeur de la dépense est crédité du montant total ;
 *  - chaque participant (incluant éventuellement le payeur) est débité
 *    `amount / participants.length`.
 *  - net = somme(crédits) - somme(débits)
 *
 * Algorithme de settlement : greedy classique qui apparie à chaque tour le
 * plus gros créditeur avec le plus gros débiteur. Il produit au pire
 * `n - 1` transferts et se comporte très bien sur des petits groupes
 * (colocations de 2 à 8 personnes).
 */
export function useExpenseSplit(
  expenses: Expense[],
  roommates: string[]
): UseExpenseSplitResult {
  return useMemo(() => {
    // Initialise toutes les balances à 0 pour conserver l'ordre des colocs.
    const netByUser = new Map<string, number>();
    for (const id of roommates) {
      netByUser.set(id, 0);
    }

    for (const exp of expenses) {
      if (!exp.participants.length || exp.amount <= 0) continue;
      const share = exp.amount / exp.participants.length;

      // Le payeur est crédité du montant total avancé.
      netByUser.set(
        exp.payerId,
        (netByUser.get(exp.payerId) ?? 0) + exp.amount
      );

      // Chaque participant est débité de sa part.
      for (const participant of exp.participants) {
        netByUser.set(
          participant,
          (netByUser.get(participant) ?? 0) - share
        );
      }
    }

    const balances: Balance[] = roommates.map((userId) => ({
      userId,
      // Arrondi au franc pour éviter les flottants moches en UI.
      net: Math.round(netByUser.get(userId) ?? 0),
    }));

    // --- Settlement greedy ---------------------------------------------
    // On copie les balances pour ne pas muter le résultat exposé.
    const working = balances
      .map((b) => ({ userId: b.userId, net: b.net }))
      // On ignore les soldes nuls (tolérance 1 FCFA après arrondi).
      .filter((b) => Math.abs(b.net) > 0);

    const settlements: Settlement[] = [];
    // Boucle bornée : à chaque tour on solde au moins une personne, donc
    // au maximum `working.length` itérations.
    let guard = working.length * 2;
    while (working.length > 1 && guard-- > 0) {
      working.sort((a, b) => a.net - b.net); // débiteurs en tête, créditeurs en fin
      const debtor = working[0];
      const creditor = working[working.length - 1];
      if (debtor.net >= 0 || creditor.net <= 0) break;

      const transfer = Math.min(-debtor.net, creditor.net);
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(transfer),
      });

      debtor.net += transfer;
      creditor.net -= transfer;

      // Retire les personnes soldées (tolérance 1 FCFA).
      if (Math.abs(debtor.net) < 1) working.shift();
      if (working.length && Math.abs(working[working.length - 1].net) < 1) {
        working.pop();
      }
    }

    return { balances, settlements };
  }, [expenses, roommates]);
}
