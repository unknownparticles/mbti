/* Shared questionnaire validation and scoring, also usable without a browser. */
(function (root) {
  const dimensions = ['EI', 'SN', 'TF', 'JP'];

  function validateQuestions(questions, count) {
    if (!Array.isArray(questions) || questions.length !== count) throw new Error('题目数量与要求不符，请重新生成。');
    const totals = { EI: 0, SN: 0, TF: 0, JP: 0 };
    for (const question of questions) {
      if (!question || !dimensions.includes(question.dimension) || typeof question.text !== 'string' || !question.text.trim() || !Array.isArray(question.options) || question.options.length !== 2) throw new Error('题目格式不完整，请重新生成。');
      const letters = question.options.map(option => option && option.letter);
      if (!question.options.every(option => option && typeof option.text === 'string' && option.text.trim()) || !question.dimension.split('').every(letter => letters.includes(letter))) throw new Error('题目选项或维度映射有误，请重新生成。');
      totals[question.dimension]++;
    }
    if (dimensions.some(dimension => totals[dimension] < 2)) throw new Error('四个维度各至少需要 2 题，请重新生成。');
    return questions;
  }

  function scoreQuestions(questions, answers) {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    questions.forEach((question, index) => {
      const choice = answers[index];
      if (!Number.isInteger(choice) || !question.options[choice]) throw new Error('请先完成所有题目。');
      scores[question.options[choice].letter]++;
    });
    const type = dimensions.map(pair => scores[pair[0]] === scores[pair[1]] ? 'X' : scores[pair[0]] > scores[pair[1]] ? pair[0] : pair[1]).join('');
    return { type, scores };
  }

  const api = { dimensions, validateQuestions, scoreQuestions };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MBTILogic = api;
})(globalThis);
