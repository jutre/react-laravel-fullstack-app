<?php
 
namespace App\Http\Controllers;
 
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;


class AuthController extends Controller
{

    /**
     * creating (registering) new user
     */

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'user' => $user
        ], 201);
    }

    /**
     * Perform login with sent credentials. On success send user id, email, name as response
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);
 
        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
 
            $user = User::where('email', $request->email)
            ->select(['id', 'email', 'name'])
            ->first();

            return response()->json(['user'=> $user]);
        }

        return response()->json(['message'=> 'invalid email and/or password'], 401);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    /**
     * Returns information about currently logged in user: id, email, name fields.
     */
    public function getCurrentLoggedInUser(Request $request)
    {
        //Current controller method is invoked only in case if user is authenticated user (route definition), no need to check if user() 
        //metnod from request returns null
        $currentUser = $request->user();
        $userInfoForResponse = [
            'id' => $currentUser->id,
            'email' => $currentUser->email,
            'name' => $currentUser->name
        ];

        return response()->json(['user'=> $userInfoForResponse]);
    }
}
