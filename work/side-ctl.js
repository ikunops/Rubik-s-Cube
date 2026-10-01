const fs = require('fs');
let t = fs.readFileSync('work/part2.html','utf8');

/* 侧栏卡片：独立视图切换按钮 */
t = t.replace(`      <section class="card">
        <h2 id="viewTitle">3D 立体图 <span class="tag" id="netTag">实时同步</span></h2>
        <div class="view-swap">`,
`      <section class="card">
        <h2 id="viewTitle">平面展开图 <span class="tag">独立视图</span></h2>
        <div class="hud" style="margin-bottom:10px">
          <button class="chip" id="btnSideNet" title="侧栏显示平面展开图">平面展开图</button>
          <button class="chip" id="btnSideMini" title="侧栏显示 3D 立体图">3D 立体图</button>
        </div>
        <div class="view-swap">`);

/* 默认显示展开图：mini 隐藏，net 显示 */
t = t.replace(`          <div class="pane" id="paneMini">
            <div class="mini-wrap"><canvas id="miniCube"></canvas></div>
          </div>
          <div class="pane hidden" id="paneNet">
            <div class="net-wrap"><div class="net" id="net"></div></div>
          </div>`,
`          <div class="pane hidden" id="paneMini">
            <div class="mini-wrap"><canvas id="miniCube"></canvas></div>
          </div>
          <div class="pane" id="paneNet">
            <div class="net-wrap"><div class="net" id="net"></div></div>
          </div>`);

/* 说明文案更新 */
t = t.replace(`          <div><span class="k">拖动贴纸</span><span>沿拖拽方向转动该层</span></div>`,
`          <div><span class="k">拖动贴纸</span><span>任意位置都可拖，整层跟手转动</span></div>`);
t = t.replace(`          <div><span class="k">空格</span><span>展开 / 折叠</span></div>`,
`          <div><span class="k">空格</span><span>主图展开 / 折叠</span></div>
          <div><span class="k">侧栏</span><span>可独立切换展开图 / 3D 图</span></div>`);

fs.writeFileSync('work/part2.html', t);
console.log('sidebar controls added');
