/**
 * 健身助手 - 智能联想版
 * 功能：包含100+数据，支持实时下拉搜索建议
 */

// ==========================================
// 1. 海量数据源 (保持不变，确保数据充足)
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

// 初始化或读取数据
const STORAGE_KEYS = { foods: 'ga_foods_v3', exercises: 'ga_exercises_v3' };
let foods = JSON.parse(localStorage.getItem(STORAGE_KEYS.foods)) || massiveFoods;
let exercises = JSON.parse(localStorage.getItem(STORAGE_KEYS.exercises)) || gymExercises;

// ==========================================
// 2. UI 元素
// ==========================================
const dom = {
  tabs: document.querySelectorAll('.tab'),
  views: document.querySelectorAll('.view'),
  // 食物相关
  foodSearch: document.getElementById('foodSearch'),
  foodSuggestBox: document.getElementById('foodSuggestBox'),
  foodWeight: document.getElementById('foodWeight'),
  calcBtn: document.getElementById('calcBtn'),
  calcResult: document.getElementById('calcResult'),
  foodList: document.getElementById('foodList'),
  // 动作相关
  exerciseSearch: document.getElementById('exerciseSearch'),
  exerciseSuggestBox: document.getElementById('exerciseSuggestBox'),
  exerciseList: document.getElementById('exerciseList'),
  // 通用
  resetDataBtn: document.getElementById('resetDataBtn')
};

// ==========================================
// 3. 核心功能：自动补全 (Auto Complete)
// ==========================================
function setupAutoComplete(input, box, data, type) {
  // 1. 监听输入事件
  input.addEventListener('input', (e) => {
      const val = e.target.value.trim().toLowerCase();
      
      if (!val) {
          box.classList.remove('show');
          // 如果是动作页面，清空搜索时显示所有
          if (type === 'exercise') renderExerciseList('');
          return;
      }

      // 2. 过滤数据
      const matches = data.filter(item => 
          item.name.toLowerCase().includes(val) || 
          (item.target && item.target.includes(val)) // 同时也搜部位
      );

      // 3. 渲染下拉建议
      if (matches.length > 0) {
          box.innerHTML = matches.slice(0, 6).map(item => { // 最多显示6条
              const metaInfo = type === 'food' ? `${item.cal} kcal` : item.target;
              return `
                  <div class="suggestion-item" data-val="${item.name}">
                      <span>${item.name}</span>
                      <span class="suggestion-meta">${metaInfo}</span>
                  </div>
              `;
          }).join('');
          box.classList.add('show');
      } else {
          box.classList.remove('show');
      }

      // 如果是动作搜索，实时更新下方大列表
      if (type === 'exercise') renderExerciseList(val);
  });

  // 4. 监听点击建议项
  box.addEventListener('click', (e) => {
      const item = e.target.closest('.suggestion-item');
      if (item) {
          const val = item.dataset.val;
          input.value = val;
          box.classList.remove('show');
          
          // 选中后的后续动作
          if (type === 'food') {
              handleCalculate(); // 选中食物直接触发计算
          } else {
              renderExerciseList(val); // 选中动作直接筛选列表
          }
      }
  });

  // 5. 点击外部隐藏建议框
  document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !box.contains(e.target)) {
          box.classList.remove('show');
      }
  });
}

// ==========================================
// 4. 其他业务逻辑
// ==========================================

const getYoutubeLink = (keyword) => `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword + ' 动作教学')}`;

function renderFoodList() {
  dom.foodList.innerHTML = foods.slice(0, 30).map(f => `
      <div class="item">
          <div class="item-row">
              <strong>${f.name}</strong>
              <button class="ghost-btn" onclick="deleteFood('${f.id}')">×</button>
          </div>
          <div class="cue">${f.cal} kcal / 100g</div>
      </div>
  `).join('');
}

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
          <div class="item-row" style="margin-top:5px;justify-content:flex-end;">
               <button class="ghost-btn" onclick="deleteExercise('${e.name}')">移除</button>
          </div>
      </div>
  `).join('');
}

function handleCalculate() {
  const keyword = dom.foodSearch.value.trim();
  const grams = parseFloat(dom.foodWeight.value);

  if (!keyword) return;

  const food = foods.find(f => f.name === keyword) || foods.find(f => f.name.includes(keyword));
  
  if (food) {
      const total = ((food.cal / 100) * grams).toFixed(0);
      dom.calcResult.innerHTML = `
          <div style="background:#f0f9ff; color:#0369a1; padding:12px; border-radius:8px; border:1px solid #bae6fd; animation: slideFadeIn 0.3s;">
              <div>${food.name} (${grams}g)</div>
              <div style="font-size:24px; font-weight:bold; margin-top:4px;">${total} <span style="font-size:14px;">kcal</span></div>
          </div>`;
  } else {
      dom.calcResult.innerHTML = `<span style="color:#ef4444">未找到"${keyword}"</span>`;
  }
}

function switchView(viewName) {
  dom.tabs.forEach(t => t.classList.toggle('active', t.dataset.view === viewName));
  dom.views.forEach(v => {
      v.classList.remove('active');
      if (v.dataset.view === viewName) setTimeout(() => v.classList.add('active'), 10);
  });
}

// ==========================================
// 5. 初始化与事件绑定
// ==========================================

// 初始化两个搜索框的联想功能
setupAutoComplete(dom.foodSearch, dom.foodSuggestBox, foods, 'food');
setupAutoComplete(dom.exerciseSearch, dom.exerciseSuggestBox, exercises, 'exercise');

dom.calcBtn.addEventListener('click', handleCalculate);
dom.resetDataBtn.addEventListener('click', () => {
  if(confirm('重置数据？')) {
      localStorage.clear();
      location.reload();
  }
});

dom.tabs.forEach(tab => tab.addEventListener('click', () => switchView(tab.dataset.view)));

// 初始渲染
renderFoodList();
renderExerciseList();

// 全局删除函数
window.deleteFood = (id) => {
  if(confirm('删除此项？')) {
      foods = foods.filter(f => f.id !== id);
      localStorage.setItem(STORAGE_KEYS.foods, JSON.stringify(foods));
      renderFoodList();
  }
};
window.deleteExercise = (name) => {
  if(confirm('删除此动作？')) {
      exercises = exercises.filter(e => e.name !== name);
      localStorage.setItem(STORAGE_KEYS.exercises, JSON.stringify(exercises));
      renderExerciseList(dom.exerciseSearch.value);
  }
};

// PWA Service Worker 注册
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}