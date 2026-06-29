<?php
/**
 * Production-ready cPanel Media Delete API
 * HolidayMart Multivendor Project
 * 
 * Securely deletes uploaded images from:
 * - /uploads/products/
 * - /uploads/vendors/
 * - /uploads/categories/
 * 
 * Prevents Directory Traversal attacks.
 */

// Enable CORS for specific frontend applications
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://holidaymartbd.com',
    'https://www.holidaymartbd.com'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
}

header("Access-Control-Allow-Methods: POST, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Define API Key (Must match upload.php)
define('API_KEY', 'HolidayMartMediaSecuredToken2026!');

// Handle preflight CORS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure the request is POST or DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    respondError("Method not allowed. Only POST or DELETE is accepted.", 405);
}

// Validate API Key
$headers = getallheaders();
$receivedApiKey = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : (isset($headers['x-api-key']) ? $headers['x-api-key'] : '');
if (empty($receivedApiKey) && isset($_SERVER['HTTP_X_API_KEY'])) {
    $receivedApiKey = $_SERVER['HTTP_X_API_KEY'];
}

if (empty($receivedApiKey) || $receivedApiKey !== API_KEY) {
    respondError("Unauthorized. Invalid or missing API Key.", 401);
}

// Read raw body input (in case frontend posts JSON content)
$rawInput = json_decode(file_get_contents('php://input'), true);

$folder = isset($_POST['folder']) ? $_POST['folder'] : (isset($rawInput['folder']) ? $rawInput['folder'] : '');
$filename = isset($_POST['filename']) ? $_POST['filename'] : (isset($rawInput['filename']) ? $rawInput['filename'] : '');
$url = isset($_POST['url']) ? $_POST['url'] : (isset($rawInput['url']) ? $rawInput['url'] : '');

// If URL is passed, parse the folder and filename from it
if (!empty($url)) {
    $parsedUrl = parse_url($url);
    $path = isset($parsedUrl['path']) ? $parsedUrl['path'] : '';
    
    // Pattern: /uploads/(products|vendors|categories|banners)/[filename]
    if (preg_match('/\/uploads\/(products|vendors|categories|banners)\/([a-zA-Z0-9_\-\.]+)/', $path, $matches)) {
        $folder = $matches[1];
        $filename = $matches[2];
    } else {
        respondError("Could not parse file information from the provided URL.", 400);
    }
}

// Clean and sanitize inputs
$folder = trim($folder);
$filename = trim($filename);

if (empty($folder) || empty($filename)) {
    respondError("Missing required parameters: 'folder' and 'filename' (or 'url').", 400);
}

// Strict validation of directory targets
$allowedFolders = ['products', 'vendors', 'categories', 'banners'];
if (!in_array($folder, $allowedFolders)) {
    respondError("Invalid folder target. Allowed: products, vendors, categories, banners.", 400);
}

// Directory Traversal Prevention
// 1. Force $filename to be just the basename (strips any path injection like '../' or '/etc/')
$filename = basename($filename);

// 2. Regex check to restrict characters only to alphanumeric, hyphens, underscores and dots
if (!preg_match('/^[a-zA-Z0-9_\-\.]+$/', $filename)) {
    respondError("Invalid filename format detected. Deletion aborted.", 400);
}

// 3. Double check no double dots exist
if (strpos($filename, '..') !== false) {
    respondError("Path traversal attempt detected. Deletion aborted.", 400);
}

// Build final absolute file path
$targetFilePath = dirname(__DIR__) . '/uploads/' . $folder . '/' . $filename;

// Ensure target file is inside the actual uploads directory (canonical path comparison)
$realBaseUploadsDir = realpath(dirname(__DIR__) . '/uploads/' . $folder);
$realTargetFilePath = realpath(dirname($targetFilePath));

if ($realBaseUploadsDir === false || $realTargetFilePath === false || $realTargetFilePath !== $realBaseUploadsDir) {
    respondError("Path traversal validation failed. File is outside uploads zone.", 403);
}

// Proceed with file deletion
if (file_exists($targetFilePath)) {
    if (unlink($targetFilePath)) {
        echo json_encode([
            'status' => 'success',
            'message' => 'File deleted successfully.',
            'filename' => $filename,
            'folder' => $folder
        ]);
        exit();
    } else {
        respondError("Internal error. Failed to delete file on disk. Check cPanel write/delete permissions.", 500);
    }
} else {
    // If it does not exist, consider it already deleted/cleared
    http_response_code(404);
    echo json_encode([
        'status' => 'success',
        'message' => 'File did not exist or was already deleted.',
        'filename' => $filename,
        'folder' => $folder
    ]);
    exit();
}

/**
 * Helper to respond with JSON error and HTTP status code
 */
function respondError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'status' => 'error',
        'message' => $message
    ]);
    exit();
}
