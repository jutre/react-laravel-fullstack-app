<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/


// not used currently Route::post('/register', [AuthController::class, 'register']); 
Route::get('/current_logged_in_user', [AuthController::class, 'getCurrentLoggedInUser'])->middleware('auth:sanctum');

Route::post('/login', [AuthController::class, 'login']);
Route::delete('/login', [AuthController::class, 'logout']);

//books - CRUD operations
Route::get('/books', [BookController::class, 'index'])->middleware('auth:sanctum');
Route::get('/books/{id}', [BookController::class, 'show'])->middleware('auth:sanctum');
Route::post('/books', [BookController::class, 'store'])->middleware('auth:sanctum');
Route::put('/books/{id}', [BookController::class, 'update'])->middleware('auth:sanctum');
Route::delete('/books', [BookController::class, 'destroy'])->middleware('auth:sanctum');

//books - search
Route::get('/books/search/{title}', [BookController::class, 'search'])->middleware('auth:sanctum');

//favorite books list - read list, add or remove book from favorite book list
Route::get('/favorite-books', [BookController::class, 'getFavoriteBooks'])->middleware('auth:sanctum');
Route::post('/favorite-books/{id}', [BookController::class, 'addBookToFavorites'])->middleware('auth:sanctum');
Route::delete('/favorite-books/{id}', [BookController::class, 'removeBookFromFavorites'])->middleware('auth:sanctum');

//reseting demo data
Route::post('/demo-data-reset', [BookController::class, 'resetDemoData'])->middleware('auth:sanctum');
