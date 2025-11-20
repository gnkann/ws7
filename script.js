// script.js

// --- 1. КОНСТАНТИ ТА ЗМІННІ ---
const ANIM_DURATION = 15; // Інтервал кроку в мс (2.i)
const SQUARE_SIZE = 15;
const SPEED = 2.5; // Швидкість руху

let animationInterval = null;
let eventCounter = 0;
let isAnimationRunning = false;

// Змінні для розмірів anim (оновлюються при запуску)
let ANIM_WIDTH = 0;
let ANIM_HEIGHT = 0;
let ANIM_CENTER_Y = 0;

let localStorageEvents = [];

let squares = [
    { id: 'green-square', element: null, x: 0, y: 0, dx: 0, dy: 0, color: 'зелений' },
    { id: 'orange-square', element: null, x: 0, y: 0, dx: 0, dy: 0, color: 'помаранчевий' }
];

// --- 2. ФУНКЦІЇ ЗБЕРІГАННЯ ДАНИХ (2.b, 2.c, 2.h) ---

/** Створює об'єкт події. */
function createEvent(message) {
    return {
        id: ++eventCounter,
        message: message,
        clientTime: new Date().toISOString() // Локальний час
    };
}

/** Відображає повідомлення у Controls. */
function displayMessage(msg) {
    const display = document.getElementById('message-display');
    display.textContent = `Подія ${eventCounter}: ${msg}`;
}

/** 2.b: Негайне відправлення на сервер. */
function saveEventToServer(event) {
    fetch('save_event.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
    })
    .then(response => response.json())
    .then(data => {
        // Відображення серверного часу
        displayMessage(`${event.message} [Сервер: ${new Date(data.serverTime).toLocaleTimeString('uk-UA')}]`);
    })
    .catch(error => console.error('Помилка збереження на сервер (Спосіб 1):', error));
}

/** 2.c: Акумуляція в LocalStorage. */
function accumulateEvent(event) {
    localStorageEvents.push(event);
    localStorage.setItem('anim_events', JSON.stringify(localStorageEvents));
}

/** Обробник подій (виклик обох способів). */
function handleEvent(message) {
    const event = createEvent(message);
    saveEventToServer(event);   // Спосіб 1
    accumulateEvent(event);     // Спосіб 2
}

// --- 3. ФУНКЦІЇ АНІМАЦІЇ (2.f, 2.g) ---

/** Ініціалізація розмірів та позицій квадратів. */
function initializeSquares() {
    const animElement = document.getElementById('anim');
    ANIM_WIDTH = animElement.clientWidth;
    ANIM_HEIGHT = animElement.clientHeight;
    ANIM_CENTER_Y = ANIM_HEIGHT / 2;
    
    // Ініціалізація елементів
    squares[0].element = document.getElementById(squares[0].id);
    squares[1].element = document.getElementById(squares[1].id);

    squares.forEach((sq, index) => {
        // Випадкова горизонтальна координата (2.f)
        sq.x = Math.random() * (ANIM_WIDTH - SQUARE_SIZE);
        
        // Позиція Y: верхня (0) або нижня (ANIM_HEIGHT - SQUARE_SIZE)
        sq.y = (index === 0) ? 0 : (ANIM_HEIGHT - SQUARE_SIZE); 
        
        // Випадковий кут (2.f)
        let angle = Math.random() * 2 * Math.PI; 
        
        // Переконуємось, що dy не нульовий
        if (Math.abs(Math.sin(angle)) < 0.1) angle += 0.5;

        sq.dx = SPEED * Math.cos(angle);
        sq.dy = SPEED * Math.sin(angle);
        
        // Якщо квадрат знизу, спрямовуємо його вгору
        if (index === 1 && sq.dy > 0) sq.dy *= -1; 
        // Якщо квадрат зверху, спрямовуємо його вниз
        if (index === 0 && sq.dy < 0) sq.dy *= -1;

        updateSquareStyle(sq);
    });
}

/** Оновлення стилів квадратів. */
function updateSquareStyle(sq) {
    sq.element.style.transform = `translate(${sq.x}px, ${sq.y}px)`;
}

/** Логіка одного кроку анімації. */
function updateAnimation() {
    if (!isAnimationRunning) return;

    // 1. Рух
    squares.forEach(sq => {
        sq.x += sq.dx;
        sq.y += sq.dy;
        updateSquareStyle(sq);
        handleEvent(`Крок: ${sq.color}`); // (2.h)
    });

    // 2. Дотик до стінок (2.f)
    squares.forEach(sq => {
        // Ліва/Права стінка
        if (sq.x <= 0 || sq.x >= ANIM_WIDTH - SQUARE_SIZE) {
            if (sq.x <= 0) sq.x = 0; // Корекція позиції
            if (sq.x >= ANIM_WIDTH - SQUARE_SIZE) sq.x = ANIM_WIDTH - SQUARE_SIZE;
            sq.dx *= -1; 
            handleEvent(`Дотик: ${sq.color} до вертикальної стінки`); 
        }
        // Верхня/Нижня стінка
        if (sq.y <= 0 || sq.y >= ANIM_HEIGHT - SQUARE_SIZE) {
            if (sq.y <= 0) sq.y = 0;
            if (sq.y >= ANIM_HEIGHT - SQUARE_SIZE) sq.y = ANIM_HEIGHT - SQUARE_SIZE;
            sq.dy *= -1; 
            handleEvent(`Дотик: ${sq.color} до горизонтальної стінки`); 
        }
    });

    // 3. Дотик квадратів між собою (2.f)
    const s1 = squares[0];
    const s2 = squares[1];
    if (s1.x < s2.x + SQUARE_SIZE && s1.x + SQUARE_SIZE > s2.x && 
        s1.y < s2.y + SQUARE_SIZE && s1.y + SQUARE_SIZE > s2.y) 
    {
        // Зміна напрямків на протилежні
        s1.dx *= -1; s1.dy *= -1;
        s2.dx *= -1; s2.dy *= -1;
        handleEvent("Зіткнення квадратів"); 
    }

    // 4. Умова зупинки (2.f, 2.g)
    const s1_is_top = s1.y < ANIM_CENTER_Y;
    const s2_is_top = s2.y < ANIM_CENTER_Y;
    const s1_is_bottom = s1.y >= ANIM_CENTER_Y;
    const s2_is_bottom = s2.y >= ANIM_CENTER_Y;
    
    if ((s1_is_top && s2_is_top) || (s1_is_bottom && s2_is_bottom)) {
        stopAnimation("квадрати в одній половині");
    }
}

/** Зупиняє анімацію та оновлює кнопки. */
function stopAnimation(reason) {
    if (!isAnimationRunning) return;
    
    clearInterval(animationInterval);
    isAnimationRunning = false;
    
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('reload-btn').style.display = 'inline';
    
    handleEvent(`Анімація зупинена: ${reason}`); // (2.h)
}

/** Запуск анімації. */
function startAnimation() {
    if (isAnimationRunning) return;
    
    initializeSquares();
    isAnimationRunning = true;
    document.getElementById('start-btn').disabled = true; // (2.g)
    
    handleEvent("Анімація розпочата"); 
    
    animationInterval = setInterval(updateAnimation, ANIM_DURATION);
}

// --- 4. ВІДОБРАЖЕННЯ РЕЗУЛЬТАТІВ (2.h) ---

/** Зчитує дані з сервера та LocalStorage і відображає їх у блоці 4. */
function displayResults() {
    const resultsDiv = document.getElementById('results-display');
    resultsDiv.innerHTML = '<h3>Результати збереження подій</h3>';

    // Функція для завантаження даних
    const loadData = (url, title, isLocalStorage = false) => {
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const events = isLocalStorage ? JSON.parse(localStorage.getItem('anim_events') || '[]') : data;
                
                let html = `<h4>${title}</h4><table border="1" width="100%"><tr><th>ID</th><th>Повідомлення</th><th>Час події (Клієнт)</th>`;
                if (!isLocalStorage) html += `<th>Час збереження (Сервер)</th></tr>`; else html += `</tr>`;
                
                events.forEach(e => {
                    html += `<tr><td>${e.id}</td><td>${e.message}</td><td>${new Date(e.clientTime).toLocaleTimeString('uk-UA', { hour12: false, second: '2-digit', millisecond: '3-digit' })}</td>`;
                    if (!isLocalStorage) html += `<td>${new Date(e.serverTime).toLocaleTimeString('uk-UA', { hour12: false, second: '2-digit', millisecond: '3-digit' })}</td></tr>`; else html += `</tr>`;
                });
                html += `</table>`;
                resultsDiv.innerHTML += html;
            })
            .catch(error => resultsDiv.innerHTML += `<p>Помилка завантаження даних (${title}): ${error.message}</p>`);
    };

    // Спосіб 1: Сервер
    loadData('server_events.json', 'Спосіб 1: Негайне відправлення (Сервер)');
    
    // Спосіб 2: LocalStorage (використовуємо JSON файл лише для зручності порівняння)
    loadData('localstorage_events.json', 'Спосіб 2: Акумуляція в LocalStorage', true);
}


// --- 5. ОБРОБНИКИ ПОДІЙ ТА ІНІЦІАЛІЗАЦІЯ ---

document.addEventListener('DOMContentLoaded', () => {
    // 2.d: Кнопка "play" у блоці "5"
    document.getElementById('play-btn').addEventListener('click', () => {
        document.getElementById('work').style.display = 'block';
        handleEvent("Кнопка 'play' натиснута"); // (2.h)
        // Перевіряємо, чи є збережені події, щоб ініціалізувати лічильник
        const storedEvents = JSON.parse(localStorage.getItem('anim_events') || '[]');
        if (storedEvents.length > 0) {
            localStorageEvents = storedEvents;
            eventCounter = storedEvents[storedEvents.length - 1].id;
        }
    });

    // 2.d: Кнопка "close" зліва у "controls"
    document.getElementById('close-btn').addEventListener('click', () => {
        clearInterval(animationInterval); // Зупиняємо анімацію на випадок, якщо вона була запущена
        
        // 2.c: Одне кінцеве відправлення акумульованих даних з LocalStorage
        fetch('save_final.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: localStorage.getItem('anim_events') 
        })
        .then(() => {
            handleEvent("Кнопка 'close' натиснута. Фінальне збереження LocalStorage.");
            displayResults(); 
        })
        .catch(error => console.error('Помилка фінального збереження:', error))
        .finally(() => {
            // Приховуємо "work" (2.d)
            document.getElementById('work').style.display = 'none';
        });
    });

    // 2.g: Кнопка "start"
    document.getElementById('start-btn').addEventListener('click', startAnimation);

    // 2.g: Кнопка "reload"
    document.getElementById('reload-btn').addEventListener('click', () => {
        document.getElementById('start-btn').disabled = false;
        document.getElementById('start-btn').style.display = 'inline';
        document.getElementById('reload-btn').style.display = 'none';
        
        initializeSquares(); // Переставити квадрати на нові місця
        handleEvent("Кнопка 'reload' натиснута");
    });
    
    // Ініціалізуємо розміри та позиції квадратів після завантаження
    initializeSquares();
});