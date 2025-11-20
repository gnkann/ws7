<?php
// 2.b: Встановлення коректної часової зони
date_default_timezone_set('Europe/Kyiv'); 

// 1. Отримання даних з клієнта
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data) {
    // 2. Фіксація серверного часу з мілісекундами
    $time_parts = explode('.', microtime(true));
    $serverTime = date('Y-m-d H:i:s', $time_parts[0]) . '.' . substr($time_parts[1], 0, 3);
    $data['serverTime'] = $serverTime;

    // 3. Збереження даних у файл (імітація бази даних)
    $file = 'server_events.json';
    
    // Читання існуючих даних
    $current = [];
    if (file_exists($file)) {
        $file_content = file_get_contents($file);
        if ($file_content) {
            $current = json_decode($file_content, true) ?: [];
        }
    }
    
    // Додавання нової події
    $current[] = $data;
    
    // Запис назад у файл
    file_put_contents($file, json_encode($current, JSON_PRETTY_PRINT));

    // 4. Відповідь клієнту з часом сервера
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'serverTime' => $serverTime]);
} else {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
}
?>