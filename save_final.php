<?php
// Отримання акумульованих даних з LocalStorage
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data) {
    // Збереження даних у файл для Способу 2
    $file = 'localstorage_events.json';
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));

    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
} else {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
}
?>