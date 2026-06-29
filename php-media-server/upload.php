<?php
/**
 * Production-ready cPanel Media Upload API
 * HolidayMart Multivendor Project
 * 
 * Securely handles multipart/form-data uploads to:
 * - /uploads/products/
 * - /uploads/vendors/
 * - /uploads/categories/
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

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Define API Key (Change this to a strong secret token)
define('API_KEY', 'HolidayMartMediaSecuredToken2026!');

// Handle preflight CORS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure the request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondError("Method not allowed. Only POST is accepted.", 405);
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

// Validate folder parameter
if (!isset($_POST['folder'])) {
    respondError("Missing 'folder' target parameter.", 400);
}

$allowedFolders = ['products', 'vendors', 'categories', 'banners'];
$folder = trim($_POST['folder']);

if (!in_array($folder, $allowedFolders)) {
    respondError("Invalid folder target. Allowed: products, vendors, categories, banners.", 400);
}

// Validate file upload existence
if (!isset($_FILES['file'])) {
    respondError("No file uploaded under key 'file'.", 400);
}

$file = $_FILES['file'];

// Check upload error codes
if ($file['error'] !== UPLOAD_ERR_OK) {
    $errMessage = getUploadErrorMessage($file['error']);
    respondError("Upload failed: " . $errMessage, 400);
}

// Validate file size (Max 2 MB)
$maxSize = 2 * 1024 * 1024; // 2MB
if ($file['size'] > $maxSize) {
    respondError("File is too large. Max allowed size is 2 MB.", 400);
}

// Validate actual MIME Type (Do not trust client-side extensions)
$tmpPath = $file['tmp_name'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $tmpPath);
finfo_close($finfo);

$allowedMimeTypes = [
    'image/jpeg' => 'jpg',
    'image/jpg'  => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp'
];

if (!array_key_exists($mimeType, $allowedMimeTypes)) {
    respondError("Forbidden file type. Only JPG, JPEG, PNG, and WEBP images are allowed.", 400);
}

$extension = $allowedMimeTypes[$mimeType];

// Sanitize original filename to preserve it safely
$originalName = pathinfo($file['name'], PATHINFO_FILENAME);
$sanitizedName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $originalName);
if (empty($sanitizedName)) {
    $sanitizedName = 'image_' . time();
}
$newFilename = $sanitizedName . '.' . $extension;

// Define directories
$baseDir = dirname(__DIR__) . '/uploads/' . $folder . '/';
if (!is_dir($baseDir)) {
    if (!mkdir($baseDir, 0755, true)) {
        respondError("Failed to create destination directories. Check cPanel write permissions.", 500);
    }
}

// Prevent collisions by appending a counter if the file already exists
$counter = 1;
$uniqueFilename = $newFilename;
while (file_exists($baseDir . $uniqueFilename)) {
    $uniqueFilename = $sanitizedName . '_' . $counter . '.' . $extension;
    $counter++;
}
$newFilename = $uniqueFilename;

// Save the file
$destinationPath = $baseDir . $newFilename;
if (move_uploaded_file($tmpPath, $destinationPath)) {
    // Determine host protocol and domain
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'];
    
    // Custom media URL fallback (HolidayMart config)
    if ($host === 'media.holidaymartbd.com' || strpos($host, 'holidaymartbd.com') !== false) {
        $fileUrl = "https://media.holidaymartbd.com/uploads/" . $folder . "/" . $newFilename;
    } else {
        $fileUrl = $protocol . $host . "/uploads/" . $folder . "/" . $newFilename;
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'File uploaded successfully.',
        'filename' => $newFilename,
        'folder' => $folder,
        'url' => $fileUrl
    ]);
    exit();
} else {
    respondError("Failed to save the uploaded file to destination path.", 500);
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

/**
 * Maps PHP UPLOAD_ERR codes to readable messages
 */
function getUploadErrorMessage($code) {
    switch ($code) {
        case UPLOAD_ERR_INI_SIZE:
            return "The uploaded file exceeds the upload_max_filesize directive in php.ini.";
        case UPLOAD_ERR_FORM_SIZE:
            return "The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.";
        case UPLOAD_ERR_PARTIAL:
            return "The uploaded file was only partially uploaded.";
        case UPLOAD_ERR_NO_FILE:
            return "No file was uploaded.";
        case UPLOAD_ERR_NO_TMP_DIR:
            return "Missing a temporary folder.";
        case UPLOAD_ERR_CANT_WRITE:
            return "Failed to write file to disk.";
        case UPLOAD_ERR_EXTENSION:
            return "A PHP extension stopped the file upload.";
        default:
            return "Unknown upload error.";
    }
}
