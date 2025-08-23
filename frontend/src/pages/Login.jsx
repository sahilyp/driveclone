import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  // Sign In
  async function handleSignIn(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // store token for later backend API calls
    localStorage.setItem("access_token", data.session.access_token);
    localStorage.setItem("refresh_token", data.session.refresh_token);

    nav("/drive"); // redirect to drive
  }

  // Sign Up
  async function handleSignUp(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Check your email to confirm your account.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        className="space-y-4 p-6 bg-white rounded shadow-md w-80"
        onSubmit={handleSignIn}
      >
        <h1 className="text-2xl font-bold text-center">Sign In</h1>

        <input
          className="border p-2 rounded w-full"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-2 rounded w-full"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="bg-black text-white px-4 py-2 rounded w-full">
          Sign In
        </button>

        <button
          type="button"
          className="border px-4 py-2 rounded w-full"
          onClick={handleSignUp}
        >
          Create Account
        </button>
      </form>
    </div>
  );
}
