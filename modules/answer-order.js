(function (root) {
  "use strict";

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function hasLongRun(sequence, maximumRun = 2) {
    let run = 1;
    for (let index = 1; index < sequence.length; index += 1) {
      run = sequence[index] === sequence[index - 1] ? run + 1 : 1;
      if (run > maximumRun) return true;
    }
    return false;
  }

  function createBalancedPlan(stepCount, optionCount = 3, random = Math.random) {
    const base = [];
    for (let index = 0; index < stepCount; index += 1) base.push(index % optionCount);

    for (let attempt = 0; attempt < 200; attempt += 1) {
      const candidate = shuffle(base, random);
      if (!hasLongRun(candidate)) return candidate;
    }

    const fallback = [];
    let previous = -1;
    while (fallback.length < stepCount) {
      const block = shuffle(Array.from({ length: optionCount }, (_, index) => index), random);
      if (block[0] === previous && block.length > 1) [block[0], block[1]] = [block[1], block[0]];
      fallback.push(...block);
      previous = block[block.length - 1];
    }
    return fallback.slice(0, stepCount);
  }

  function arrangeOptions(options, correctPosition, random = Math.random) {
    const correct = options.find((option) => option.correct);
    const incorrect = shuffle(options.filter((option) => !option.correct), random);
    if (!correct || incorrect.length !== options.length - 1) throw new Error("每一步必須恰有一個正確選項。");
    const position = Math.max(0, Math.min(options.length - 1, correctPosition));
    const ordered = [...incorrect];
    ordered.splice(position, 0, correct);
    return ordered;
  }

  root.AnswerOrder = { createBalancedPlan, arrangeOptions, hasLongRun };
})(typeof window === "undefined" ? globalThis : window);
