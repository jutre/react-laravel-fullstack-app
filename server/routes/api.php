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

//not using Route::resource() for route mapping as delete method is not in standart form, it receives deletable records identifiers in
//request body
Route::get('/books', [BookController::class, 'index'])->middleware('auth:sanctum');
Route::get('/books/{id}', [BookController::class, 'show'])->middleware('auth:sanctum');
Route::get('/books/search/{title}', [BookController::class, 'search'])->middleware('auth:sanctum');
Route::post('/books', [BookController::class, 'store'])->middleware('auth:sanctum');
Route::put('/books/{id}', [BookController::class, 'update'])->middleware('auth:sanctum');
Route::delete('/books', [BookController::class, 'destroy'])->middleware('auth:sanctum');
