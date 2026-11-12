(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.assessmentScoring = api;
})(typeof window === "object" ? window : globalThis, function () {
  "use strict";
  const reports = {
    princess: {
      name: "城堡中的豌豆公主", image: "princess-hd.jpg",
      summary: "你是感受细腻、共情力强，也渴望被理解与珍惜的人。",
      tags: ["细腻感受", "渴望被理解", "主权萌芽"],
      headline: "你的感受，值得被认真对待。",
      description: "这次选择更贴近“城堡中的豌豆公主”：你对关系和环境里的细微信号很敏感，也渴望被理解、被珍惜。细腻不是你的缺点；当注意力总围绕他人转动时，你也需要为自己的声音留一点位置。",
      opportunity: "从“别人会不会失望”，慢慢走向“我真正想要什么”。不必用一次次退让，交换自己的价值感。",
      practice: "今天找一件小事，先问自己“我愿意吗”，再给出答案。一个温和而清晰的表达，就是找回主权的开始。",
      hook: "如何保留你的温柔，又不再委屈自己？",
      topics: ["讨好与自我压抑，可能在哪些情境里出现", "你的敏感如何转化为边界与表达的力量", "从小决定开始，建立自己的行动节奏"]
    },
    mermaid: {
      name: "重生之小美人鱼恋爱季", image: "mermaid.jpg",
      summary: "你是真挚浪漫、珍视亲密联结，愿意为爱投入的人。",
      tags: ["浪漫感受力", "渴望联结", "关系中的自我"],
      headline: "爱一个人，也可以不丢下自己。",
      description: "这次选择更贴近“重生之小美人鱼恋爱季”：亲密联结对你很重要，你愿意投入，也容易被关系中的回应牵动。你身上有真挚的浪漫与感受力，而这份爱，也值得留一部分给自己。",
      opportunity: "看见“我想靠近你”和“我害怕失去你”的区别。关系可以重要，但不必成为自我价值的唯一来源。",
      practice: "写下你在关系里最重要的三项需要，以及一条不想再让步的底线。先让自己听见，再慢慢表达。",
      hook: "为什么越在意一段关系，越容易忘了自己？",
      topics: ["你在亲密关系里的需求与反复出现的模式", "吸引力、投入与边界，如何找到自己的平衡", "建立安全感时，可以从哪些日常选择开始"]
    },
    mulan: {
      name: "暗夜花木兰勇猛之心", image: "mulan.jpg",
      summary: "你是独立勇敢、有行动力，面对挑战愿意担当的人。",
      tags: ["独立行动", "目标感", "勇敢担当"],
      headline: "你可以很有力量，也可以不必总是硬撑。",
      description: "这次选择更贴近“暗夜花木兰勇猛之心”：你有面对挑战的勇气，愿意靠行动改变处境，也很在意自己是否足够优秀。你的独立与担当是力量，但真正的强大，也容得下疲惫、求助和偶尔的停顿。",
      opportunity: "从“必须证明我可以”，走向“我可以选择适合自己的方式”。努力之外，身体的感受和真实的需要同样重要。",
      practice: "挑一件正在硬扛的事，分清“必须由我做”和“可以协作或调整”的部分，为自己减掉一项不必要的负担。",
      hook: "如何让你的行动力，走向松弛而非耗竭？",
      topics: ["目标感背后，哪些动力在支持或消耗你", "独立与接收支持之间，你的平衡点在哪里", "怎样把边界、休息和创造放进同一个生活节奏"]
    },
    nature: {
      name: "野生派大自然女儿", image: "nature.jpg",
      summary: "你是热爱自由、鲜活好奇，在探索中舒展生命力的人。",
      tags: ["自由探索", "鲜活生命力", "体验与表达"],
      headline: "你身上的鲜活，就是一种独特的力量。",
      description: "这次选择更贴近“野生派大自然女儿”：你倾向于在自然、旅行和新鲜体验里获得滋养。真实的感受、自由的流动与对世界的好奇，是你与生活建立联结的方式。",
      opportunity: "让自由不只是一时逃离，也成为能持续滋养你的生活方式。把体验留下来，慢慢形成自己的表达与创造。",
      practice: "为一次让你有生命力的体验留下记录：一句感受、一张照片或一小段作品。看看其中有什么，是你愿意持续分享的。",
      hook: "你的自由与生命力，如何成为可持续的创造？",
      topics: ["哪些生活情境能真正滋养你的状态", "你的鲜活感如何形成独特的表达风格", "探索、日常与现实行动之间，如何彼此支持"]
    },
    fairy: {
      name: "灵气艺术型星际精灵", image: "fairy.jpg",
      summary: "你是感知细腻、想象丰富，在独处与创作中滋养自己的人。",
      tags: ["细腻感知", "艺术表达", "内在创作"],
      headline: "那些细微的感受，也可以长成作品。",
      description: "这次选择更贴近“灵气艺术型星际精灵”：你容易被艺术、音乐与精神世界触动，也偏爱在独处和创作里安放自己。你的感知与想象，是很有个人辨识度的表达资源。",
      opportunity: "不必等到状态完美，才允许作品被看见。让内在的感受有一个现实出口，也为创作建立温柔而稳定的边界。",
      practice: "给一个停在脑海里的灵感十五分钟，只做出一个小小的初稿，不评判完成度。先让它真实地出现。",
      hook: "如何把丰富的内在世界，变成被看见的表达？",
      topics: ["你的感知特点与适合的创作表达方式", "独处滋养与回避现实之间，如何分辨", "怎样为灵感建立能够持续的行动容器"]
    },
    soul22: {
      name: "寻找火花的灵魂22号《心灵气旅》", image: "soul22.jpg",
      summary: "你是对生命充满好奇，正在寻找内心热爱与真实自我的人。",
      tags: ["生命探索", "内在觉察", "寻找火花"],
      headline: "不必先找到终极答案，才开始生活。",
      description: "这次选择更贴近“寻找火花的灵魂22号”：你对生命的意义与真实自我有持续的好奇。探索可以带来新的理解，而你也值得在普通的一天里，感受身体、关系和生活本身的温度。",
      opportunity: "让理解回到体验。并不是每一个选择都要先被赋予宏大意义，细微的喜欢，也能成为靠近自己的线索。",
      practice: "今天留意一个让你真切感到“我在生活”的瞬间。不急着解释它，只把那份感受记下来。",
      hook: "你寻找的“火花”，会藏在哪些日常体验里？",
      topics: ["你当前的探索，正在回应什么真实需要", "如何连接内在理解与身体、关系的体验", "怎样把追问生命的热情，带回具体的一天"]
    },
    creator: {
      name: "觉醒创造者入世游戏", image: "creator.jpg",
      summary: "你是重视内在觉察，也渴望把愿景化为现实创造的人。",
      tags: ["觉察与行动", "丰盛创造", "现实落地"],
      headline: "把你理解的世界，活成你创造的生活。",
      description: "这次选择更贴近“觉醒创造者入世游戏”：你既关注内在觉察，也希望在现实世界里创造、表达与收获。对你而言，成长不只停留在理解，而是逐渐落实为作品、关系与生活中的选择。",
      opportunity: "让愿景与具体行动彼此连接，同时给过程留下空间。丰盛不只是一种结果，也包括持续创造时的感受与关系。",
      practice: "从一个最想实现的愿景里，找出本周可以完成的一个小行动，写下时间与边界，然后允许自己边做边调整。",
      hook: "如何把内在清晰，转化为稳定的现实创造？",
      topics: ["你的愿景、天赋表达与现实目标如何对齐", "创造过程中，哪些习惯帮助或阻碍持续行动", "如何在投入、接收与休息之间形成自己的节奏"]
    },
    sage: {
      name: "空性觉者回归创造者身份", image: "sage.jpg",
      summary: "你是注重内在觉察，愿意以接纳与开放拥抱生活的人。",
      tags: ["内在觉察", "接纳与通透", "回归当下"],
      headline: "回到当下，也回到真实的自己。",
      description: "这次选择更贴近“空性觉者回归创造者身份”：你的回答更关注内在觉察、接纳与生命体验，也倾向于不把自己固定在单一评价里。这是本次自我描述呈现的方向，并不代表觉醒等级或修行认证。",
      opportunity: "让通透落实在普通生活里。对自己和他人的真实感受保持开放，也愿意在关系与行动中继续修正理解。",
      practice: "选一件最普通的日常事，完整地感受身体与当下，再看看：此刻有什么小小的行动，能够照顾自己或他人？",
      hook: "如何让内在的理解，真正进入关系与生活？",
      topics: ["你的内在理解与现实体验是否相互支持", "接纳与回避、松弛与停滞之间如何分辨", "如何在日常关系和创造中，持续实践自己的理解"]
    }
  };
  function classify(total, goal, lifestyle) {
    if (!Number.isFinite(total)) throw new Error("Invalid total score");
    if (total <= 23) return goal === "A" ? "princess" : "mermaid";
    if (total <= 46) return "mulan";
    if (total <= 69) {
      if (lifestyle === "A") return "nature";
      if (lifestyle === "B") return "fairy";
      return "soul22";
    }
    return goal === "C" ? "creator" : "sage";
  }
  function calculate(config, answers) {
    let total = 0;
    let goal;
    let lifestyle;
    for (const question of config.questions) {
      const option = question.options.find((item) => item.id === answers[question.id]);
      if (!option) throw new Error(`Missing or invalid answer: ${question.id}`);
      if (question.role === "goal") goal = option.id;
      else if (question.role === "lifestyle") lifestyle = option.id;
      else {
        if (!Number.isFinite(option.score)) throw new Error(`Missing score: ${question.id}`);
        total += option.score;
      }
    }
    if (!goal || !lifestyle) throw new Error("Missing branching questions");
    const classificationTotal = equateTotal(total, config.scoring);
    const typeId = classify(classificationTotal, goal, lifestyle);
    return { total, classificationTotal, typeId, report: reports[typeId] };
  }
  function equateTotal(total, rule) {
    if (!Number.isFinite(total)) throw new Error("Invalid total score");
    if (!rule.method) return total;
    if (rule.method !== "range-equating-v1"
      || ![rule.minimum, rule.maximum, rule.referenceMinimum, rule.referenceMaximum].every(Number.isFinite)
      || rule.maximum <= rule.minimum || rule.referenceMaximum <= rule.referenceMinimum) {
      throw new Error("Invalid score conversion");
    }
    if (total < rule.minimum || total > rule.maximum) throw new Error("Score outside configured range");
    // Preserve original cutoffs; this range conversion does not validate the shortened instrument.
    return rule.referenceMinimum + (total - rule.minimum)
      * (rule.referenceMaximum - rule.referenceMinimum) / (rule.maximum - rule.minimum);
  }
  return { classify, calculate, equateTotal, reports };
});
