const fs = require('fs');
let s = fs.readFileSync('work/part2.html','utf8');

/* 侧栏卡片：改为双视图切换 */
s = s.replace(`      <section class="card">
        <h2>平面展开图 <span class="tag" id="netTag">实时同步</span></h2>
        <div class="net-wrap"><div class="net" id="net"></div></div>
      </section>`,
`      <section class="card">
        <h2 id="viewTitle">3D 立体图 <span class="tag" id="netTag">实时同步</span></h2>
        <div class="view-swap">
          <div class="pane" id="paneMini">
            <div class="mini-wrap"><canvas id="miniCube"></canvas></div>
          </div>
          <div class="pane hidden" id="paneNet">
            <div class="net-wrap"><div class="net" id="net"></div></div>
          </div>
        </div>
      </section>`);

fs.writeFileSync('work/part2.html', s);
console.log('sidebar dual-view added');
