/**
 * 健身助手 - 完整全栈版
 * 功能：前端管理界面交互 + 后端数据同步
 */

// ==========================================
// 1. 数据源 (保留本地数据用于搜索和展示)
// ==========================================
const massiveFoods = [
  {id:'f1', name:'米饭(熟)', cal:116}, {id:'f2', name:'馒头', cal:223}, {id:'f3', name:'全麦面包', cal:246},
  {id:'f4', name:'燕麦片', cal:377}, {id:'f5', name:'红薯', cal:86}, {id:'f6', name:'玉米', cal:112},
  {id:'f7', name:'土豆', cal:81}, {id:'f8', name:'意面(干)', cal:350}, {id:'f9', name:'小米粥', cal:46},
  {id:'f13', name:'鸡胸肉', cal:133}, {id:'f14', name:'鸡蛋(个)', cal:144}, {id:'f15', name:'牛肉(瘦)', cal:106},
  {id:'f16', name:'猪瘦肉', cal:143}, {id:'f17', name:'三文鱼', cal:139}, {id:'f18', name:'虾仁', cal:85},
  {id:'f19', name:'牛奶', cal:65}, {id:'f20', name:'酸奶(无糖)', cal:72}, {id:'f25', name:'金枪鱼罐头', cal:116},
  {id:'f30', name:'西兰花', cal:34}, {id:'f31', name:'菠菜', cal:23}, {id:'f33', name:'黄瓜', cal:16},
  {id:'f34', name:'番茄', cal:18}, {id:'f50', name:'苹果', cal:53}, {id:'f51', name:'香蕉', cal:93},
  {id:'f70', name:'可乐', cal:43}, {id:'f71', name:'薯片', cal:548}, {id:'f72', name:'巧克力', cal:586},
  {id:'f73', name:'花生', cal:574}, {id:'f76', name:'橄榄油', cal:884}, {id:'f79', name:'奶茶', cal:60},
  {id:'f80', name:'麦当劳巨无霸', cal:257}, {id:'f81', name:'肯德基炸鸡', cal:280}, {id:'f90', name:'蓝莓', cal:57}
];

const gymExercises = [
  { target: '胸', name: '平板杠铃卧推', cues: ['收紧肩胛', '触胸发力'] },
  { target: '胸', name: '上斜哑铃卧推', cues: ['椅子30度', '手肘微内收'] },
  { target: '胸', name: '俯卧撑', cues: ['核心收紧', '不塌腰'] },
  { target: '背', name: '引体向上', cues: ['沉肩', '下巴过杠'] },
  { target: '背', name: '高位下拉', cues: ['肘尖向下', '挺胸'] },
  { target: '背', name: '坐姿划船', cues: ['挤压背部', '不要过度后仰'] },
  { target: '腿', name: '杠铃深蹲', cues: ['膝盖对脚尖', '臀部后坐'] },
  { target: '腿', name: '罗马尼亚硬拉', cues: ['屁股后顶', '大腿后侧拉伸'] },
  { target: '腿', name: '箭步蹲', cues: ['垂直下落', '重心居中'] },
  { target: '肩', name: '哑铃推举', cues: ['核心收紧', '不耸肩'] },
  { target: '肩', name: '侧平举', cues: ['像倒水一样', '肘微屈'] },
  { target: '臂', name: '二头弯举', cues: ['大臂贴身', '离心控制'] },
  { target: '臂', name: '三头下压', cues: ['大臂锁死', '到底夹紧'] },
  { target: '腹', name: '卷腹', cues: ['下背贴地', '卷起上背'] },
  { target: '腹', name: '平板支撑', cues: ['身体直线', '收腹夹臀'] }
];

// 初始化
let foods = massiveFoods; 
let exercises = gymExercises;

// ==========================================
// 2. UI 元素获取
// ==========================================
const dom = {
  tabs: document.querySelectorAll('.tab'),
  views: document.querySelectorAll('.view'),
  foodSearch: document.getElementById('foodSearch'),
  foodSuggestBox: document.getElementById('foodSuggestBox'),
  foodWeight: document.getElementById('foodWeight'),
  calcBtn: document.getElementById('calcBtn'),
  calcResult: document.getElementById('calcResult'),
  foodList: document.getElementById('foodList'),
  exerciseSearch: document.getElementById('exerciseSearch'),
  exerciseSuggestBox: document.getElementById('exerciseSuggestBox'),
  exerciseList: document.getElementById('exerciseList'),
  resetDataBtn: document.getElementById('resetDataBtn')
};

// ==========================================
// 3. 核心功能：计算并同步至后端 (已更新)
// ==========================================
async function handleCalculate() {
  const keyword = dom.foodSearch.value.trim();
  const grams = parseFloat(dom.foodWeight.value);

  if (!keyword || isNaN(grams)) return;

  // 1. 在本地库查找食物基础信息
  const food = foods.find(f => f.name === keyword) || foods.find(f => f.name.includes(keyword));
  
  if (food) {
      dom.calcResult.innerHTML = `<div class="loading">正在同步至数据库...</div>`;
      try {
          // 2. 发送请求到 FastAPI
          const response = await fetch('http://127.0.0.1:8000/add-log/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  name: food.name,
                  weight: grams,
                  calories_per_100g: food.cal
              })
          });

          // 3. 处理后端响应
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();

          // 4. 更新 UI
          dom.calcResult.innerHTML = `
              <div style="background:#dcfce7; color:#166534; padding:12px; border-radius:8px; border:1px solid #bbf7d0;">
                  <div>✅ 已存入 PostgreSQL</div>
                  <div style="font-size:20px; font-weight:bold; margin-top:4px;">
                    ${food.name}：${data.total_calories} kcal
                  </div>
              </div>`;
      } catch (error) {
          console.error(error);
          dom.calcResult.innerHTML = `<div style="color:#ef4444">❌ 后端连接失败 (请检查终端)</div>`;
      }
  } else {
      dom.calcResult.innerHTML = `<span style="color:#ef4444">未找到"${keyword}"</span>`;
  }
}

// ==========================================
// 4. 界面交互逻辑 (视图切换 & 列表渲染)
// ==========================================

// 切换标签页 (修复点：找回了丢失的 switchView)
function switchView(viewName) {
  dom.tabs.forEach(t => t.classList.toggle('active', t.dataset.view === viewName));
  dom.views.forEach(v => {
      v.classList.remove('active');
      // 简单的延时动画效果
      if (v.dataset.view === viewName) setTimeout(() => v.classList.add('active'), 10);
  });
}

// 渲染动作列表 (修复点：找回了丢失的 renderExerciseList)
const getYoutubeLink = (keyword) => `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword + ' 动作教学')}`;

function renderExerciseList(filterText = '') {
  const list = filterText 
      ? exercises.filter(e => e.name.includes(filterText) || e.target.includes(filterText))
      : exercises;

  dom.exerciseList.innerHTML = list.map(e => `
      <div class="item">
          <div class="item-row">
              <strong>${e.name} <span class="tag">${e.target}</span></strong>
              <a href="${getYoutubeLink(e.name)}" target="_blank" class="video-link">▶ 视频</a>
          </div>
          <div class="cue">${e.cues.join(' · ')}</div>
      </div>
  `).join('');
}

// 自动补全逻辑
function setupAutoComplete(input, box, data, type) {
  input.addEventListener('input', (e) => {
      const val = e.target.value.trim().toLowerCase();
      if (!val) {
          box.classList.remove('show');
          if (type === 'exercise') renderExerciseList('');
          return;
      }
      const matches = data.filter(item => item.name.toLowerCase().includes(val));
      
      if (matches.length > 0) {
          box.innerHTML = matches.slice(0, 6).map(item => `
              <div class="suggestion-item" data-val="${item.name}">
                  <span>${item.name}</span>
                  <span class="suggestion-meta">${type === 'food' ? item.cal + ' kcal' : ''}</span>
              </div>
          `).join('');
          box.classList.add('show');
      } else { box.classList.remove('show'); }

      if (type === 'exercise') renderExerciseList(val);
  });

  box.addEventListener('click', (e) => {
      const item = e.target.closest('.suggestion-item');
      if (item) {
          input.value = item.dataset.val;
          box.classList.remove('show');
          if (type === 'food') handleCalculate();
          if (type === 'exercise') renderExerciseList(input.value);
      }
  });

  document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !box.contains(e.target)) box.classList.remove('show');
  });
}

// ==========================================
// 5. 事件绑定与初始化
// ==========================================

// 绑定 Tab 点击事件
dom.tabs.forEach(tab => tab.addEventListener('click', () => switchView(tab.dataset.view)));

// 绑定计算按钮
dom.calcBtn.addEventListener('click', handleCalculate);

// 初始化自动补全
setupAutoComplete(dom.foodSearch, dom.foodSuggestBox, foods, 'food');
setupAutoComplete(dom.exerciseSearch, dom.exerciseSuggestBox, exercises, 'exercise');

// 初始渲染
renderExerciseList();