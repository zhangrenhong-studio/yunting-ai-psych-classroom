/* ==========================================================================
   云听 AI 智慧心理教室 · 小悦悦对话引擎
   --------------------------------------------------------------------------
   结构上如何保证"不下结论、不贴标签"：

   1. 对话节点只允许 4 种角色，每种角色对应一个受约束的言语行为：
        catch   接住   —— 用学生的原词把话还回去
        clarify 澄清   —— 提一个开放的、关于"在意什么/想要什么"的问题
        support 支持   —— 给 2~3 个平权的可选方向，含"还不确定"
        step    下一步 —— 邀请一个极小、可拒绝的行动

   2. 匹配不到 / 匹配并列 / 学生跳过 —— 这三种情况下的回话，只能从
      talk-fallbacks.js 的引擎池里取，课程包无法覆盖。

   3. 课程包里的分支回复会被 YTFallback.check() 扫一遍禁词，不通过就退回兜底池。

   4. 一条学生消息之后最多推进一层。绝不连续追问——那是逼问感的主要来源。
   ========================================================================== */

(function (global) {
  'use strict';

  var STRONG_WEIGHT = 3;
  var WEAK_WEIGHT = 1;

  /* --- 归一化：全角转半角、去标点、去空白 --- */
  function normalize(text) {
    if (text == null) { return ''; }
    var s = String(text);

    // 全角字符 → 半角
    s = s.replace(/[！-～]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
    });
    s = s.replace(/　/g, ' ');

    // 去掉标点与空白，只留下可匹配的实义字
    s = s.replace(/[\s，。、！？；：""''（）《》【】,.!?;:"'()\[\]<>~`@#$%^&*_+=|\\/-]/g, '');

    return s.toLowerCase();
  }

  /**
   * 给一段学生输入打分。
   * @returns {{branchId:(string|null), score:number, tied:boolean}}
   */
  function score(text, branches) {
    var norm = normalize(text);
    var best = null;
    var bestScore = 0;
    var tie = false;

    if (!norm || !branches) {
      return { branchId: null, score: 0, tied: false };
    }

    for (var i = 0; i < branches.length; i++) {
      var b = branches[i];
      var s = 0;

      var strong = b.strong || [];
      for (var j = 0; j < strong.length; j++) {
        if (norm.indexOf(normalize(strong[j])) !== -1) { s += STRONG_WEIGHT; }
      }

      var weak = b.weak || [];
      for (var k = 0; k < weak.length; k++) {
        if (norm.indexOf(normalize(weak[k])) !== -1) { s += WEAK_WEIGHT; }
      }

      if (s > bestScore) {
        bestScore = s;
        best = b.id;
        tie = false;
      } else if (s === bestScore && s > 0) {
        tie = true;
      }
    }

    return {
      branchId: bestScore > 0 ? best : null,
      score: bestScore,
      tied: tie
    };
  }

  /**
   * 决定这一轮小悦悦说什么。
   * 决策顺序是刻意的——先承认没听懂，再谈匹配。
   *
   * @param {Object} args
   *   text     学生这次输入
   *   skipped  是否点了跳过
   *   branches 本节点可用的分支
   *   replies  分支回复表 { branchId: string }
   * @returns {{kind:string, branchId:(string|null), text:string}}
   */
  function decide(args) {
    var text = args.text;
    var branches = args.branches || [];
    var replies = args.replies || {};

    // 1. 跳过 / 空输入
    if (args.skipped || !normalize(text)) {
      return { kind: 'skip', branchId: null, text: global.YTFallback.draw('skip') };
    }

    var r = score(text, branches);

    // 2. 没命中，或分不够 —— 走反映池，引用原话
    if (!r.branchId || r.score < STRONG_WEIGHT) {
      return { kind: 'reflect', branchId: null, text: global.YTFallback.draw('reflect') };
    }

    // 3. 并列 —— 我们没听懂，那就承认没听懂，而不是猜
    if (r.tied) {
      return { kind: 'widen', branchId: null, text: global.YTFallback.draw('widen') };
    }

    // 4. 命中唯一分支
    var reply = replies[r.branchId];
    if (!reply) {
      return { kind: 'reflect', branchId: null, text: global.YTFallback.draw('reflect') };
    }

    // 5. 分支回复也要过禁词检查——不通过就退回兜底
    var hits = global.YTFallback.check(reply);
    if (hits.length > 0) {
      if (global.console && console.warn) {
        console.warn('[对话引擎] 分支 "' + r.branchId + '" 的回复含禁词 ' +
                     hits.join('、') + '，已退回兜底池。');
      }
      return { kind: 'reflect', branchId: null, text: global.YTFallback.draw('reflect') };
    }

    return { kind: 'branch', branchId: r.branchId, text: reply };
  }

  /**
   * 课程包自检：在每个对话节点上扫一遍禁词。
   * 开发时跑一次，就能在评审前发现问题，而不是等学生看到。
   */
  function lint(course) {
    var problems = [];
    var talk;
    try { talk = course.stages.talk; } catch (e) { return ['课程包结构不完整，读不到 stages.talk']; }

    if (!talk || !talk.nodes) { return ['stages.talk.nodes 缺失']; }

    for (var i = 0; i < talk.nodes.length; i++) {
      var n = talk.nodes[i];
      var where = 'nodes[' + i + '](' + (n.id || '?') + ')';

      // 节点角色必须是四种之一
      var okRole = { catch: 1, clarify: 1, support: 1, step: 1 };
      if (!okRole[n.role]) {
        problems.push(where + ' 使用了不允许的角色 "' + n.role + '"');
      }

      // say 文案扫禁词
      var says = n.say || [];
      for (var j = 0; j < says.length; j++) {
        var hits = global.YTFallback.check(says[j]);
        if (hits.length > 0) {
          problems.push(where + ' 的 say[' + j + '] 含禁词：' + hits.join('、'));
        }
      }

      // 分支回复扫禁词
      var replies = n.replies || {};
      for (var bid in replies) {
        if (!Object.prototype.hasOwnProperty.call(replies, bid)) { continue; }
        var rh = global.YTFallback.check(replies[bid]);
        if (rh.length > 0) {
          problems.push(where + ' 的分支 "' + bid + '" 回复含禁词：' + rh.join('、'));
        }
        // 每个分支至少要有一个 strong 词，否则会被泛化误吞
        var found = false;
        var bs = n.branches || [];
        for (var k = 0; k < bs.length; k++) {
          if (bs[k].id === bid && bs[k].strong && bs[k].strong.length > 0) { found = true; }
        }
        if (!found) {
          problems.push(where + ' 的分支 "' + bid + '" 没有 strong 词，会与其它分支互相吞噬');
        }
      }
    }

    return problems;
  }

  /* --- 轮次管理：45 分钟的课不能被一个学生拖住 --- */
  function makeTurnCounter(max) {
    var used = 0;
    return {
      used: function () { return used; },
      left: function () { return Math.max(0, max - used); },
      spend: function () { used += 1; return used <= max; },
      exhausted: function () { return used >= max; }
    };
  }

  global.YTDialogue = {
    normalize: normalize,
    score: score,
    decide: decide,
    lint: lint,
    makeTurnCounter: makeTurnCounter
  };
})(window);
