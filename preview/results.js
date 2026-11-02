/* Biographical sources support the life events, not the speculative type labels. */
(function (root) {
  const people = {
    INTJ:['玛丽·居里','物理学家、化学家。她在巴黎研究放射性，参与发现钋与镭，并先后获得物理学和化学诺贝尔奖。','她长期推进复杂研究，可作为坚持研究方向的讨论例子。','https://www.nobelprize.org/prizes/chemistry/1911/marie-curie/biographical/'],
    INTP:['阿尔伯特·爱因斯坦','理论物理学家。他曾在伯尔尼专利局工作，1905 年发表多项重要研究，后来获得诺贝尔物理学奖。','他的理论探索可作为独立思考与追问原理的讨论例子。','https://www.nobelprize.org/prizes/physics/1921/einstein/facts/'],
    INFJ:['马丁·路德·金','美国民权运动领袖、牧师。他通过非暴力行动争取民权，1964 年获得诺贝尔和平奖。','他的公共行动和对平等的关注可作为价值与愿景的讨论例子。','https://www.nobelprize.org/prizes/peace/1964/king/biographical/'],
    INFP:['泰戈尔','印度诗人、作家和教育家。他创办实验学校，1913 年获得诺贝尔文学奖。','他的文学创作与教育实践可作为个人表达和理想的讨论例子。','https://www.nobelprize.org/prizes/literature/1913/tagore/biographical/'],
    ENTJ:['温斯顿·丘吉尔','英国政治家、作家。他在第二次世界大战期间担任首相，1953 年获得诺贝尔文学奖。','他的政治领导和历史写作可作为组织行动与长期目标的讨论例子。','https://www.nobelprize.org/prizes/literature/1953/churchill/biographical/'],
    ENTP:['理查德·费曼','美国物理学家，因量子电动力学方面的工作与他人共同获得 1965 年诺贝尔物理学奖。','他的物理研究与教学经历可作为探索不同思路的讨论例子。','https://www.nobelprize.org/prizes/physics/1965/feynman/facts/'],
    ENFJ:['纳尔逊·曼德拉','南非反种族隔离运动领袖。他长期参与政治斗争，1993 年获得诺贝尔和平奖。','他组织政治行动并推动社会转型，可作为公共目标与合作的讨论例子。','https://www.nobelprize.org/prizes/peace/1993/mandela/biographical/'],
    ENFP:['贝尔塔·冯·苏特纳','奥地利作家与和平运动人士。她写作反战小说，并于 1905 年获得诺贝尔和平奖。','她通过写作和公共活动推动和平，可作为表达理念的讨论例子。','https://www.nobelprize.org/nomination/archive/show.php?id=5525'],
    ISTJ:['亨利·贝克勒尔','法国物理学家。他研究铀盐时发现自然放射性，与居里夫妇共同获得 1903 年诺贝尔物理学奖。','他对实验现象的观察可作为关注证据与细节的讨论例子。','https://www.nobelprize.org/prizes/physics/1903/becquerel/facts/'],
    ISFJ:['简·亚当斯','美国社会改革家。她共同创办赫尔之家，参与社会服务与和平运动，1931 年获得诺贝尔和平奖。','她持续组织社区服务，可作为关注具体需要的讨论例子。','https://www.nobelprize.org/prizes/peace/1931/addams/biographical/'],
    ISTP:['欧内斯特·海明威','美国作家。他曾从事新闻工作，著有《老人与海》，1954 年获得诺贝尔文学奖。','他的新闻与文学经历可作为观察具体经验和表达方式的讨论例子。','https://www.nobelprize.org/prizes/literature/1954/hemingway/biographical/'],
    ISFP:['赛珍珠','美国作家。她在中国生活多年，以描写中国农民生活的小说闻名，1938 年获得诺贝尔文学奖。','她通过文学描绘生活经验，可作为观察与表达的讨论例子。','https://www.nobelprize.org/prizes/literature/1938/buck/facts/'],
    ESTJ:['阿尔伯特·史怀哲','医生、神学家和音乐家。他在加蓬建立医院，1952 年获得诺贝尔和平奖。','他组织医疗工作可作为把长期目标落实到行动的讨论例子。','https://www.nobelprize.org/prizes/peace/1952/schweitzer/facts/'],
    ESFJ:['特蕾莎修女','天主教修女。她在加尔各答从事慈善工作并创建仁爱传教修会，1979 年获得诺贝尔和平奖。','她组织照护活动可作为关注他人需要的讨论例子。','https://www.nobelprize.org/prizes/peace/1979/teresa/biographical/'],
    ESTP:['萧伯纳','爱尔兰剧作家。他创作了《卖花女》等戏剧，1925 年获得诺贝尔文学奖。','他通过戏剧参与公共讨论，可作为表达观点与应对现实议题的讨论例子。','https://www.nobelprize.org/prizes/literature/1925/shaw/facts/'],
    ESFP:['约翰·斯坦贝克','美国作家。他的小说《愤怒的葡萄》描写经济大萧条时期的美国社会，1962 年获得诺贝尔文学奖。','他的作品关注人物与社会生活，可作为观察现实经验的讨论例子。','https://www.nobelprize.org/prizes/literature/1962/steinbeck/facts/']
  };
  const descriptions = {
    E:'你在本次情境中较常选择通过互动和交流整理想法。', I:'你在本次情境中较常选择先独处、观察或思考。',
    S:'你较常关注具体信息、已有经验和实际细节。', N:'你较常关注可能性、联系和整体含义。',
    T:'你较常以逻辑、标准和分析来整理选择。', F:'你较常关注人的感受、关系和个人价值。',
    J:'你较常偏好提前安排和明确下一步。', P:'你较常偏好保留空间并根据情况调整。'
  };
  const suggestions = {
    basic:'把结果当作观察自己的起点：回想近期有哪些选择与它一致，也留意不一致的情境。',
    complete:'结合四组分数回顾具体经历，留意分数接近的维度；可以在不同情境中再次观察自己的选择。',
    food:'下次选餐时，可以同时尝试一道熟悉的菜和一种新搭配，并记录自己的真实偏好。',
    interests:'为一个感兴趣的活动安排一次低成本尝试，体验后再决定是否长期投入。',
    career:'把工作偏好与技能、工作条件及个人目标一起考虑，用小项目验证选择；不要以类型决定职业适配。',
    relationships:'与对方直接讨论沟通方式、个人空间和计划习惯；两个人的实际需要比类型标签更重要。'
  };
  const music = {
    E:'节奏鲜明的放克，如 Stevie Wonder 的《Superstition》', I:'安静的器乐，如 Erik Satie 的《Gymnopédie No. 1》',
    S:'旋律清晰的流行，如 The Beatles 的《Here Comes the Sun》', N:'注重即兴变化的爵士，如 Miles Davis 的《So What》',
    T:'层次丰富的器乐，如 Bach 的《Brandenburg Concerto No. 3》', F:'注重人声表达的灵魂乐，如 Aretha Franklin 的《(You Make Me Feel Like) A Natural Woman》',
    J:'按顺序完整聆听一张专辑，如 The Beatles 的《Abbey Road》', P:'探索不同风格的专辑，如 David Bowie 的《The Rise and Fall of Ziggy Stardust and the Spiders from Mars》'
  };
  const musicSources = [
    ['16Personalities 音乐调查（自选样本）','https://www.16personalities.com/articles/what-your-music-taste-says-about-your-personality-a-study'],
    ['音乐偏好与大五人格的跨国研究','https://pubmed.ncbi.nlm.nih.gov/35130023/'],
    ['人格与音乐偏好关联的荟萃分析','https://doi.org/10.1016/j.paid.2017.04.061']
  ];
  const data = { people, descriptions, suggestions, music, musicSources };
  root.MBTIResults = data;
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
})(globalThis);
