// =================配置与状态=================
const API_BASE = "http://127.0.0.1:8000";
let currentLang = localStorage.getItem('lang') || 'cn';
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let calorieChart = null;
let toastTimeout = null;

// 新增：肌肉图互动状态管理
let mapGender = 'male'; // 'male' or 'female'
let mapView = 'Front'; // 'Front' or 'Back'
let selectedMuscles = []; // 按点击顺序保存选中的肌肉 data-target values

// =================多语言配置=================
const i18n = {
    cn: {
        title_calc: "热量计算", title_exercise: "动作库", title_plan: "每日计划", title_profile: "个人中心",
        nav_calc: "计算", nav_ex: "动作", nav_plan: "计划", nav_me: "个人",
        placeholder_search: "输入食物名称", placeholder_weight: "重量(克)", btn_calc: "计算热量",
        placeholder_ex_search: "搜索动作 / 肌肉群...", subtitle_bmr: "基础代谢设定", subtitle_log: "今日摄入",
        meal_b: "早餐", meal_l: "午餐", meal_d: "晚餐", meal_s: "加餐",
        btn_save_graph: "保存并生成图表", login_title: "登录 / 注册", btn_login: "登录", btn_register: "注册", btn_logout: "退出",
        lang_setting: "语言设置", alert_login: "请先登录！", alert_fill: "请填写完整信息", watch_video: "📺 观看教程"
    },
    en: {
        title_calc: "Calorie Calc", title_exercise: "Library", title_plan: "Daily Plan", title_profile: "Profile",
        nav_calc: "Calc", nav_ex: "Gym", nav_plan: "Plan", nav_me: "Me",
        placeholder_search: "Food name...", placeholder_weight: "Weight (g)", btn_calc: "Calculate",
        placeholder_ex_search: "Search workout...", subtitle_bmr: "BMR Settings", subtitle_log: "Today's Log",
        meal_b: "Breakfast", meal_l: "Lunch", meal_d: "Dinner", meal_s: "Snack",
        btn_save_graph: "Save & Graph", login_title: "Login / Register", btn_login: "Login", btn_register: "Register", btn_logout: "Logout",
        lang_setting: "Language", alert_login: "Please login first!", alert_fill: "Please fill all fields", watch_video: "📺 Watch Video"
    }
};

// ================= 新增：Expanded 肌肉群科普知识 =================
const muscleBenefits = {
    '胸部': '打造挺拔身姿，增加上半身厚度与立体感。',
    '背部': '塑造V型/倒三角体型，改善圆肩驼背，提升整体气质。 (含背阔肌 exercises)',
    '肩部': '加宽肩部比例，形成完美头肩比，穿衣更有型。',
    '手臂': '增加手臂围度（男）或紧致手臂线条告别拜拜肉（女）。 (含肱二、肱三 exercises)',
    '腹肌': '打造马甲线/八块腹肌，收紧腰腹核心，提升躯干稳定性。',
    '臀腿': '提臀瘦腿，提升下肢力量与全身代谢，塑造完美曲线。 (含臀部、大腿、小腿 exercises)'
};

// ================= 数据源：海量食物库 (扩充版) =================
const baseFoods = [
    {name:'米饭', cal:116}, {name:'馒头', cal:223}, {name:'鸡胸肉', cal:133}, 
    {name:'水煮蛋', cal:144}, {name:'煎鸡蛋', cal:200}, {name:'牛肉', cal:106}, 
    {name:'燕麦', cal:377}, {name:'牛奶', cal:65}, {name:'苹果', cal:53},
    {name:'拿铁', cal:50}, {name:'沙拉', cal:30}, {name:'西兰花', cal:34},
    {name:'香蕉', cal:93}, {name:'可乐', cal:43}, {name:'面包', cal:260}
];

const extendedFoods = [
    {name:'糙米饭', cal:111}, {name:'全麦面包', cal:246}, {name:'面条(煮)', cal:110}, {name:'包子(肉)', cal:227},
    {name:'红薯', cal:86}, {name:'玉米', cal:112}, {name:'猪肉(瘦)', cal:143}, {name:'牛排', cal:180},
    {name:'鸡腿', cal:181}, {name:'三文鱼', cal:139}, {name:'虾仁', cal:48}, {name:'菠菜', cal:23},
    {name:'西红柿', cal:18}, {name:'豆腐', cal:84}, {name:'豆浆', cal:31}, {name:'植物油', cal:899}
];

const massiveFoods = [...baseFoods];
extendedFoods.forEach(newItem => {
    if (!massiveFoods.some(existing => existing.name === newItem.name)) massiveFoods.push(newItem);
});

const unitStandards = {
    '个': { '水煮蛋': 50, '煎鸡蛋': 60, '苹果': 200, '香蕉': 120, '馒头': 100 },
    '杯': { '牛奶': 250, '拿铁': 300, '豆浆': 300 },
    '碗': { '米饭': 200 }
};

const ambiguousFoods = { '鸡蛋': '是水煮蛋还是煎鸡蛋？', '米饭': '是白米饭还是炒饭？' };

// --- 动作库 (expanded with examples for back lats, triceps, leg glutes, leg calves) ---
const gymExercises = [
    // Chest
    {name: '杠铃卧推', target: '胸部', cues: '沉肩收胛，慢下快推', video: 'Barbell Bench Press tutorial'},
    {name: '哑铃上斜卧推', target: '胸部', cues: '椅子调节30-45度', video: 'Incline Dumbbell Press tutorial'},
    {name: '俯卧撑', target: '胸部', cues: '核心收紧，身体呈直线', video: 'Push Up tutorial'},
    {name: '双杠臂屈伸', target: '胸部', cues: '身体前倾侧重胸肌', video: 'Chest Dips tutorial'},
    {name: '绳索夹胸', target: '胸部', cues: '顶峰收缩', video: 'Cable Fly tutorial'},
    
    // Back & Lats
    {name: '引体向上', target: '背部', cues: '不耸肩，挺胸', video: 'Pull Up tutorial'},
    {name: '高位下拉', target: '背部', cues: '下拉时挺胸 (主练背阔肌)', video: 'Lat Pulldown tutorial'},
    {name: '杠铃划船', target: '背部', cues: '背部挺直', video: 'Barbell Row tutorial'},
    {name: '坐姿划船', target: '背部', cues: '夹紧肩胛骨', video: 'Seated Cable Row tutorial'},
    {name: '单臂哑铃划船', target: '背部', cues: '手肘贴身向后拉', video: 'One Arm Dumbbell Row tutorial'},
    
    // Shoulders
    {name: '站姿推举', target: '肩部', cues: '杠铃垂直过头顶', video: 'Overhead Press tutorial'},
    {name: '哑铃侧平举', target: '肩部', cues: '肘部微屈', video: 'Dumbbell Lateral Raise tutorial'},
    {name: '哑铃前平举', target: '肩部', cues: '控制速度', video: 'Front Raise tutorial'},
    {name: '面拉', target: '肩部', cues: '拉向面部', video: 'Face Pull tutorial'},
    {name: '反向飞鸟', target: '肩部', cues: '感受后肩发力', video: 'Reverse Fly tutorial'},
    
    // Arms (Biceps & Triceps)
    {name: '杠铃弯举', target: '手臂', cues: '大臂夹紧身体 (主练肱二头肌)', video: 'Barbell Curl tutorial'},
    {name: '哑铃锤式弯举', target: '手臂', cues: '掌心相对 (主练肱二头肌)', video: 'Hammer Curl tutorial'},
    {name: '绳索下压', target: '手臂', cues: '用力下压到底 (主练肱三头肌)', video: 'Tricep Pushdown tutorial'},
    {name: '仰卧臂屈伸', target: '手臂', cues: '保持大臂稳定 (主练肱三头肌)', video: 'Skull Crushers tutorial'},
    {name: '窄距卧推', target: '手臂', cues: '手肘贴近身体 (肱三头肌 exercises)', video: 'Close Grip Bench Press tutorial'},
    
    // Abs
    {name: '平板支撑', target: '腹肌', cues: '不要塌腰', video: 'Plank form tutorial'},
    {name: '卷腹', target: '腹肌', cues: '下背部贴地', video: 'Crunch tutorial'},
    {name: '悬垂举腿', target: '腹肌', cues: '控制身体不晃动', video: 'Hanging Leg Raise tutorial'},
    {name: '俄罗斯转体', target: '腹肌', cues: '转动双肩', video: 'Russian Twist tutorial'},
    {name: '空中自行车', target: '腹肌', cues: '肘碰膝', video: 'Bicycle Crunch tutorial'},
    
    // Legs (Quads, Glutes, Calves)
    {name: '深蹲', target: '臀腿', cues: '膝盖对准脚尖 (臀腿综合)', video: 'Squat tutorial'},
    {name: '硬拉', target: '臀腿', cues: '杠铃贴腿 (臀部 exercises)', video: 'Deadlift tutorial'},
    {name: '箭步蹲', target: '臀腿', cues: '前后脚成90度 (臀腿综合)', video: 'Lunge tutorial'},
    {name: '腿举', target: '臀腿', cues: '不要锁死膝盖', video: 'Leg Press tutorial'},
    {name: '臀桥', target: '臀腿', cues: '顶髋向上 (主练臀部)', video: 'Glute Bridge tutorial'},
    {name: '站姿提踵', target: '臀腿', cues: '充分收缩 (主练小腿)', video: 'Standing Calf Raise tutorial'}
];

// ================= Toast 系统 =================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    if (container.firstChild) {
        container.innerHTML = ''; 
        if (toastTimeout) clearTimeout(toastTimeout);
    }
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (container.contains(toast)) toast.remove(); }, 300);
    }, 3000);
}

// ================= 智能解析逻辑 =================
function parseFoodString(str) {
    if(!str) return null;
    str = str.trim();
    for (let key in ambiguousFoods) {
        if (str === key) { showToast(`提示：${ambiguousFoods[key]}`, "warning"); return null; }
    }
    const match = str.match(/(\d+)\s*([\u4e00-\u9fa5a-zA-Z]+)?/);
    let weight = 100, foodName = str;
    if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2];
        const namePart = str.replace(match[0], '').trim();
        if(namePart) foodName = namePart;
        if (unit && unitStandards[unit] && unitStandards[unit][foodName]) {
            weight = num * unitStandards[unit][foodName];
        } else {
            weight = num;
        }
    }
    let found = massiveFoods.find(f => foodName.includes(f.name));
    return found ? { name: found.name, weight: weight, total_cal: (found.cal * weight / 100) } : null;
}

// ================= 初始化与事件绑定 =================
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    bindEvents();
    bindMuscleMapEvents();
});

function initUI() {
    updateLangUI();
    checkLoginState();
    renderInteractiveExercises(); // 初始化动作库默认列表
    
    const foodInput = document.getElementById('foodSearch');
    const suggestBox = document.getElementById('foodSuggestBox');
    if (foodInput && suggestBox) setupAutoComplete(foodInput, suggestBox, massiveFoods);
}

function bindEvents() {
    // 导航切换
    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => {
            document.querySelectorAll('.nav-item, .view').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(item.dataset.target).classList.add('active');
        };
    });

    // 计算按钮
    const calcBtn = document.getElementById('calcBtn');
    if(calcBtn) calcBtn.onclick = () => {
        const name = document.getElementById('foodSearch').value;
        const weight = parseFloat(document.getElementById('foodWeight').value);
        if(!name || !weight) return showToast("请输入名称和重量", "warning");
        const res = parseFoodString(name);
        const food = res || massiveFoods.find(f => f.name === name);
        if(food) {
            const total = res ? res.total_cal : (food.cal * weight / 100);
            document.getElementById('calcResult').innerHTML = `结果: ${total.toFixed(1)} kcal`;
        } else {
            showToast("未找到食物，请尝试更精确的名称", "error");
        }
    };

    // 保存并生成图表
    const saveBtn = document.getElementById('savePlanBtn');
    if(saveBtn) saveBtn.onclick = async () => {
        if(!currentUser) return showToast(i18n[currentLang].alert_login, "error");
        const w = parseFloat(document.getElementById('userWeight').value) || 0;
        const h = parseFloat(document.getElementById('userHeight').value) || 0;
        const a = parseInt(document.getElementById('userAge').value) || 0;
        const g = document.getElementById('userGender').value;
        let bmr = 0;
        if(w && h && a) {
            bmr = (10 * w) + (6.25 * h) - (5 * a) + (g === 'male' ? 5 : -161);
            document.getElementById('bmrValue').innerText = Math.round(bmr);
        }
        showToast("正在生成图表...", "info");
        await renderChart(currentUser.id, bmr || 2000);
        showToast("图表已更新", "success");
    };

    // 动作搜索 (融合肌肉图多选)
    const exSearch = document.getElementById('exerciseSearch');
    if(exSearch) exSearch.oninput = () => {
        renderInteractiveExercises();
    };

    // 登录注册等
    const lBtn = document.getElementById('loginBtn');
    if(lBtn) lBtn.onclick = () => handleAuth('login');
    const rBtn = document.getElementById('registerBtn');
    if(rBtn) rBtn.onclick = () => handleAuth('register');
    const loBtn = document.getElementById('logoutBtn');
    if(loBtn) loBtn.onclick = () => {
        currentUser = null;
        localStorage.removeItem('user');
        checkLoginState();
        showToast("已退出", "info");
    };
}

// ================= 新增：肌肉图互动逻辑 =================
// Helper to hide all muscle SVGs
function hideAllMuscleViews() {
    document.querySelectorAll('.muscle-svg-wrapper').forEach(wrapper => {
        wrapper.classList.remove('current-view');
        wrapper.classList.add('hidden');
    });
}

function updateMuscleView() {
    hideAllMuscleViews();
    const targetId = `svg-${mapGender}-${mapView.toLowerCase()}`;
    const targetWrapper = document.getElementById(targetId);
    if(targetWrapper) {
        targetWrapper.classList.remove('hidden');
        targetWrapper.classList.add('current-view');
    }
}

function bindMuscleMapEvents() {
    // 1. 性别切换 (男性/女性)
    const genderBtn = document.getElementById('genderToggleBtn');
    if(genderBtn) {
        genderBtn.onclick = () => {
            mapGender = mapGender === 'male' ? 'female' : 'male';
            genderBtn.innerText = mapGender === 'male' ? '男性' : '女性';
            updateMuscleView();
            showToast(`切换至${genderBtn.innerText}模型`, "info");
        };
    }

    // 2. 视角切换 (正面/背面) - UserControlled rotation representation
    const viewBtn = document.getElementById('viewToggleBtn');
    if(viewBtn) {
        viewBtn.onclick = () => {
            mapView = mapView === 'Front' ? 'Back' : 'Front';
            viewBtn.innerText = mapView === 'Front' ? '正面' : '背面';
            updateMuscleView();
            showToast(`切换至${viewBtn.innerText}视图`, "info");
        };
    }

    // 3. 重置按钮 (取消多选 + 回归正面视图)
    const resetBtn = document.getElementById('resetMuscleBtn');
    if(resetBtn) {
        resetBtn.onclick = () => {
            selectedMuscles = [];
            // Remove selection class from all muscle paths in all SVGs
            document.querySelectorAll('.muscle-svg [data-target]').forEach(el => el.classList.remove('selected'));
            
            // Revert back to front view, male gender (optionally default)
            mapView = 'Front';
            document.getElementById('viewToggleBtn').innerText = '正面';
            // Optionally reset gender to male
            // mapGender = 'male';
            // document.getElementById('genderToggleBtn').innerText = '男性';
            
            updateMuscleView();
            renderInteractiveExercises(); // render default original list
            showToast("已重置选择并回归正面视图", "success");
        };
    }

    // 4. SVG segmented detailed path click logic (Multi-select + Ordering)
    // Select all interactive muscle paths across all 4 SVGs
    document.querySelectorAll('.muscle-svg [data-target]').forEach(el => {
        el.addEventListener('click', (e) => {
            const target = el.getAttribute('data-target');
            
            if (selectedMuscles.includes(target)) {
                // If already selected, deselect
                selectedMuscles = selectedMuscles.filter(m => m !== target);
                // Remove selection high-light class from *this* muscle in *all* SVGs
                document.querySelectorAll(`.muscle-svg [data-target="${target}"]`).forEach(node => node.classList.remove('selected'));
                showToast(`已取消选择 [${target}]`, "warning");
            } else {
                // If not selected, add to end of ordering queue
                selectedMuscles.push(target);
                // Add selection high-light class to *this* muscle in *all* SVGs
                document.querySelectorAll(`.muscle-svg [data-target="${target}"]`).forEach(node => node.classList.add('selected'));
                showToast(`已多选：加入 [${target}]`, "success");
            }
            renderInteractiveExercises(); // Re-render logic is crucial here
        });
    });
}

// ================= 核心渲染逻辑：互動多選動作列表 =================
function renderInteractiveExercises() {
    const container = document.getElementById('exerciseList');
    const searchVal = document.getElementById('exerciseSearch').value.trim();
    if(!container) return;

    // 情景1：用户没有任何肌肉选择 (默认情况) - 按默认顺序排列动作
    if (selectedMuscles.length === 0) {
        let filtered = gymExercises;
        if (searchVal) {
            filtered = filtered.filter(ex => 
                ex.name.includes(searchVal) || 
                ex.target.includes(searchVal) ||
                ex.cues.includes(searchVal) // expand search range
            );
        }
        
        container.innerHTML = filtered.map(ex => `
            <div class="ex-item">
                <h4>${ex.name} <small style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-weight:normal;font-size:12px;color:#666">${ex.target}</small></h4>
                <p>${ex.cues}</p>
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.video)}" target="_blank" class="video-link">${i18n[currentLang].watch_video}</a>
            </div>
        `).join('');
        return;
    }

    // 情景2：用户选择了肌肉群 (按点击点击顺序 selectedMuscles 排列生成肌肉作用卡片)
    let html = '';
    
    selectedMuscles.forEach((muscle, index) => {
        // 抓取 aesthetic美观作用字典科普
        const benefit = muscleBenefits[muscle] || '强化该部位肌群与形态，提升身体机能。';
        // 过滤出该肌肉的动作，并支持二次搜索过滤
        let targetExercises = gymExercises.filter(ex => ex.target === muscle);
        if (searchVal) {
            targetExercises = targetExercises.filter(ex => 
                ex.name.includes(searchVal) || 
                ex.cues.includes(searchVal)
            );
        }

        // Generate dynamically ordering muscle info card
        html += `
            <div class="muscle-info-card">
                <h3>${muscle} (选择 ${index + 1})</h3>
                <div class="muscle-benefit"><strong>形态美观作用：</strong>${benefit}</div>
                <div class="ex-list-mini">
                    ${targetExercises.length > 0 ? targetExercises.map(ex => `
                        <div class="ex-item" style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
                            <h4 style="font-size:15px; margin:0 0 5px 0;">${ex.name}</h4>
                            <p style="margin:0 0 8px 0; font-size:13px; color:#64748b;">${ex.cues}</p>
                            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.video)}" target="_blank" class="video-link">${i18n[currentLang].watch_video}</a>
                        </div>
                    `).join('') : '<p style="font-size:13px; color:#94a3b8;">未找到匹配的动作群。</p>'}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ================= 辅助函数 (Keep original food and chart logic) =================
function setupAutoComplete(input, box, data) {
    input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (!val) { box.classList.remove('show'); return; }
        const matches = data.filter(i => i.name.includes(val)).slice(0, 15);
        if (matches.length > 0) {
            box.innerHTML = matches.map(i => `<div class="suggestion-item">${i.name}</div>`).join('');
            box.classList.add('show');
            box.querySelectorAll('.suggestion-item').forEach(d => {
                d.addEventListener('click', () => {
                    input.value = d.innerText;
                    box.classList.remove('show');
                });
            });
        } else {
            box.classList.remove('show');
        }
    });
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== box) box.classList.remove('show');
    });
}

async function renderChart(userId, bmrLimit) {
    const ctx = document.getElementById('caloriesChart');
    if(!ctx) return;
    if(calorieChart) calorieChart.destroy();
    const labels = ["周一", "周二", "周三", "周四", "今天"];
    const values = [1800, 2100, 1900, 2200, 1700];
    calorieChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: '摄入', data: values, borderColor: '#2563eb', tension: 0.4 },
                { label: 'BMR', data: new Array(5).fill(bmrLimit), borderColor: '#ef4444', borderDash: [5, 5] }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function updateLangUI() {
    const texts = i18n[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => el.innerText = texts[el.dataset.i18n]);
}

function checkLoginState() {
    const auth = document.getElementById('authSection');
    const user = document.getElementById('userSection');
    if(currentUser) {
        auth.classList.add('hidden');
        user.classList.remove('hidden');
        document.getElementById('displayUsername').innerText = currentUser.username;
    } else {
        auth.classList.remove('hidden');
        user.classList.add('hidden');
    }
}

async function handleAuth(type) {
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;
    if(!u || !p) return showToast("请填写完整", "warning");
    currentUser = { id: 1, username: u };
    localStorage.setItem('user', JSON.stringify(currentUser));
    checkLoginState();
    showToast(type === 'login' ? "登录成功" : "注册成功", "success");
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    location.reload(); 
}