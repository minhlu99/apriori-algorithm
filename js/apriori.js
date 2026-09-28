/**
 * Apriori Algorithm Core Engine
 * Implements:
 * 1. Frequent Itemset Mining (Join, Prune via Anti-monotonicity, Scan)
 * 2. Association Rule Generation (Support, Confidence, Lift)
 * 3. Step-by-step Execution Trace Generator for 60fps animations
 */

class AprioriEngine {
  /**
   * Sort items alphabetically to ensure consistent set representations.
   */
  static sortItemset(itemset) {
    return [...itemset].sort((a, b) => a.localeCompare(b));
  }

  /**
   * Convert an itemset array to a unique string key.
   */
  static itemsetKey(itemset) {
    return this.sortItemset(itemset).join('__&__');
  }

  /**
   * Parse a string key back into an itemset array.
   */
  static parseKey(key) {
    return key.split('__&__');
  }

  /**
   * Check if setA is a subset of setB.
   */
  static isSubset(subset, superset) {
    const superSetLookup = new Set(superset);
    return subset.every(item => superSetLookup.has(item));
  }

  /**
   * Generate all k-combinations of an array.
   */
  static getCombinations(arr, k) {
    if (k === 0) return [[]];
    if (k > arr.length) return [];
    if (k === arr.length) return [arr];
    
    const head = arr[0];
    const tail = arr.slice(1);
    
    const withHead = this.getCombinations(tail, k - 1).map(c => [head, ...c]);
    const withoutHead = this.getCombinations(tail, k);
    
    return [...withHead, ...withoutHead];
  }

  /**
   * Count support for an itemset in transaction list.
   * Returns { count, matchedTids, ratio }
   */
  static countSupport(itemset, transactions) {
    const matchedTids = [];
    for (const tx of transactions) {
      if (this.isSubset(itemset, tx.items)) {
        matchedTids.push(tx.tid);
      }
    }
    const count = matchedTids.length;
    const ratio = transactions.length > 0 ? count / transactions.length : 0;
    return { count, matchedTids, ratio };
  }

  /**
   * Self-Join step: Generate candidate k-itemsets from L_{k-1}
   * Join two itemsets if they share the first (k-2) items.
   */
  static selfJoin(prevFrequentItemsets, k) {
    const candidates = [];
    const n = prevFrequentItemsets.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const itemsetA = prevFrequentItemsets[i];
        const itemsetB = prevFrequentItemsets[j];

        // Check if first k-2 items are identical
        let canJoin = true;
        for (let idx = 0; idx < k - 2; idx++) {
          if (itemsetA[idx] !== itemsetB[idx]) {
            canJoin = false;
            break;
          }
        }

        if (canJoin) {
          // Join by combining and sorting
          const candidate = this.sortItemset(Array.from(new Set([...itemsetA, ...itemsetB])));
          if (candidate.length === k) {
            candidates.push(candidate);
          }
        }
      }
    }

    // Deduplicate candidates
    const uniqueKeys = new Set();
    const uniqueCandidates = [];
    for (const c of candidates) {
      const key = this.itemsetKey(c);
      if (!uniqueKeys.has(key)) {
        uniqueKeys.add(key);
        uniqueCandidates.push(c);
      }
    }

    return uniqueCandidates;
  }

  /**
   * Prune Step via Apriori Property (Anti-monotonicity):
   * For candidate c in C_k, verify if ALL its (k-1)-subsets exist in L_{k-1}.
   * If any subset is missing, prune candidate c immediately without scanning DB!
   */
  static checkAprioriPrune(candidate, prevFrequentLookup, k) {
    if (k <= 2) return { isPruned: false, failingSubset: null };

    const subsets = this.getCombinations(candidate, k - 1);
    for (const sub of subsets) {
      const subKey = this.itemsetKey(sub);
      if (!prevFrequentLookup.has(subKey)) {
        return { isPruned: true, failingSubset: sub };
      }
    }

    return { isPruned: false, failingSubset: null };
  }

  /**
   * Mine Association Rules from discovered Frequent Itemsets
   */
  static generateRules(allFrequentItemsetsWithSupport, transactions, minConfidenceRatio) {
    const rules = [];
    const supportLookup = new Map();

    // Index all frequent itemset supports
    for (const item of allFrequentItemsetsWithSupport) {
      supportLookup.set(this.itemsetKey(item.itemset), item.ratio);
    }

    // Generate rules for itemsets with length >= 2
    for (const item of allFrequentItemsetsWithSupport) {
      const itemset = item.itemset;
      if (itemset.length < 2) continue;

      const itemsetRatio = item.ratio;

      // Generate all non-empty proper subsets as Antecedents
      for (let size = 1; size < itemset.length; size++) {
        const antecedents = this.getCombinations(itemset, size);

        for (const antecedent of antecedents) {
          const antecedentKey = this.itemsetKey(antecedent);
          const antecedentRatio = supportLookup.get(antecedentKey) || 
            (this.countSupport(antecedent, transactions).ratio);

          if (antecedentRatio === 0) continue;

          // Consequent = Itemset \ Antecedent
          const antecedentSet = new Set(antecedent);
          const consequent = itemset.filter(x => !antecedentSet.has(x));
          const consequentKey = this.itemsetKey(consequent);
          const consequentRatio = supportLookup.get(consequentKey) ||
            (this.countSupport(consequent, transactions).ratio);

          // Metrics
          const confidence = itemsetRatio / antecedentRatio;
          const lift = consequentRatio > 0 ? (confidence / consequentRatio) : 1;

          if (confidence >= minConfidenceRatio) {
            rules.push({
              antecedent,
              consequent,
              support: itemsetRatio,
              confidence: confidence,
              lift: lift,
              supportCount: Math.round(itemsetRatio * transactions.length)
            });
          }
        }
      }
    }

    // Sort rules primarily by Lift desc (with precision rounding), then Confidence desc, then Support desc
    return rules.sort((a, b) => {
      const liftDiff = Math.round((b.lift - a.lift) * 10000);
      if (liftDiff !== 0) return liftDiff;
      const confDiff = Math.round((b.confidence - a.confidence) * 10000);
      if (confDiff !== 0) return confDiff;
      return Math.round((b.support - a.support) * 10000);
    });
  }

  /**
   * Build Step-by-Step Execution Trace for Visualizer
   * Creates a detailed journal of each candidate check, prune event, and scan.
   */
  static buildExecutionTrace(transactions, minSupportRatio, minConfidenceRatio) {
    const trace = [];
    const numTransactions = transactions.length;
    const minSupportCount = Math.ceil(minSupportRatio * numTransactions);

    // Initial event
    trace.push({
      type: 'INIT',
      message: `Khởi tạo thuật toán Apriori với ${numTransactions} giao dịch. Ngưỡng Min Support = ${(minSupportRatio * 100).toFixed(0)}% (${minSupportCount} lần), Min Confidence = ${(minConfidenceRatio * 100).toFixed(0)}%.`,
      k: 1
    });

    // Step 1: Collect unique 1-itemsets
    const uniqueItemsSet = new Set();
    for (const tx of transactions) {
      for (const item of tx.items) {
        uniqueItemsSet.add(item);
      }
    }
    const uniqueItems = Array.from(uniqueItemsSet).sort((a, b) => a.localeCompare(b));
    let candidatesK = uniqueItems.map(item => [item]);

    let k = 1;
    let prevFrequentItemsets = [];
    const allFrequentWithMeta = [];
    let prevFrequentLookup = new Set();

    while (candidatesK.length > 0) {
      const currentCandidates = candidatesK;
      const frequentAtThisLevel = [];

      trace.push({
        type: 'PHASE_START',
        k,
        message: k === 1 
          ? `Bắt đầu cấp độ k = 1: Khởi tạo ${currentCandidates.length} tập ứng viên đơn lẻ C_1.`
          : `Ghép L_${k-1} ⨝ L_${k-1} ➔ Sinh ra ${currentCandidates.length} tập ứng viên cho C_${k}.`,
        candidatesCount: currentCandidates.length,
        candidates: currentCandidates
      });

      for (const cand of currentCandidates) {
        // For k >= 3, check Anti-monotonicity Pruning first!
        let pruneResult = { isPruned: false, failingSubset: null };
        if (k >= 3) {
          pruneResult = this.checkAprioriPrune(cand, prevFrequentLookup, k);
        }

        if (pruneResult.isPruned) {
          trace.push({
            type: 'PRUNED_BY_APRIORI',
            k,
            itemset: cand,
            failingSubset: pruneResult.failingSubset,
            message: `Tỉa nhánh Apriori: Tập {${cand.join(', ')}} bị loại ngay vì chứa tập con {${pruneResult.failingSubset.join(', ')}} không thuộc L_${k - 1}!`,
            status: 'pruned'
          });
          continue;
        }

        // DB Scan for candidate
        const { count, matchedTids, ratio } = this.countSupport(cand, transactions);
        const isFrequent = ratio >= minSupportRatio;

        if (isFrequent) {
          frequentAtThisLevel.push(cand);
          allFrequentWithMeta.push({ itemset: cand, count, ratio, k });
        }

        trace.push({
          type: 'TEST_CANDIDATE',
          k,
          itemset: cand,
          count,
          ratio,
          matchedTids,
          minSupportCount,
          isFrequent,
          message: isFrequent
            ? `Tập {${cand.join(', ')}} xuất hiện ${count}/${numTransactions} lần (${(ratio * 100).toFixed(1)}%) ≥ Min Support ➔ ĐẠT (L_${k})!`
            : `Tập {${cand.join(', ')}} xuất hiện ${count}/${numTransactions} lần (${(ratio * 100).toFixed(1)}%) < Min Support ➔ Bị loại!`
        });
      }

      // Level summary
      trace.push({
        type: 'LEVEL_SUMMARY',
        k,
        frequentCount: frequentAtThisLevel.length,
        frequentItemsets: frequentAtThisLevel,
        message: `Hoàn tất cấp độ k = ${k}: Tìm được ${frequentAtThisLevel.length} tập phổ biến trong L_${k}.`
      });

      if (frequentAtThisLevel.length <= 1) {
        break; // Cannot join if 0 or 1 itemset left
      }

      // Update lookup and prepare next candidates
      prevFrequentItemsets = frequentAtThisLevel;
      prevFrequentLookup = new Set(frequentAtThisLevel.map(item => this.itemsetKey(item)));
      
      k++;
      candidatesK = this.selfJoin(prevFrequentItemsets, k);
    }

    // Step 4: Generate Association Rules
    const generatedRules = this.generateRules(allFrequentWithMeta, transactions, minConfidenceRatio);

    trace.push({
      type: 'COMPLETE',
      totalFrequent: allFrequentWithMeta.length,
      allFrequentWithMeta,
      rules: generatedRules,
      message: `Hoàn tất toàn bộ thuật toán Apriori! Khai phá thành công ${allFrequentWithMeta.length} tập phổ biến và ${generatedRules.length} luật kết hợp có ý nghĩa.`
    });

    return {
      trace,
      allFrequent: allFrequentWithMeta,
      rules: generatedRules
    };
  }
}

if (typeof window !== 'undefined') {
  window.AprioriEngine = AprioriEngine;
} else if (typeof globalThis !== 'undefined') {
  globalThis.AprioriEngine = AprioriEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AprioriEngine };
}
