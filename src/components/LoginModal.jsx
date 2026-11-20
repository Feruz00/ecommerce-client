import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useUi } from "../context/UiContext";
import { useLogin } from "../pages/auth/hooks";

export default function LoginModal() {
  const { t } = useTranslation();
  const { loginOpen, closeLogin } = useUi();

  const loginMut = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!loginOpen) return null;

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    loginMut.mutate(
      { username, password },
      {
        onSuccess: () => {
          closeLogin();
          setUsername("");
          setPassword("");
          setError("");
        },
        onError: (err) => {
          setError(err?.response?.data?.message || t("auth.loginError"));
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[1000] p-4"
      onClick={closeLogin}
    >
      <div
        className="bg-white w-full max-w-[400px] p-7 rounded-2xl relative shadow-mega"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={closeLogin}
          aria-label="Close"
          className="absolute top-4 right-4 text-xl text-slate-400 hover:text-slate-600 transition"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-1">{t("auth.loginTitle")}</h2>

        <p className="text-sm text-slate-500 mb-5">{t("auth.loginSubtitle")}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-[13px] font-medium mb-1.5">
              {t("auth.username")}
            </label>

            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("auth.username")}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[13px] font-medium mb-1.5">
              {t("auth.password")}
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loginMut.isPending}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold text-[15px] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loginMut.isPending ? t("common.loading") : t("auth.loginBtn")}
          </button>
        </form>

        <p className="text-sm text-center text-slate-500 mt-4">
          {t("auth.noAccount")}{" "}
          <Link
            to="/register"
            onClick={closeLogin}
            className="text-primary font-medium hover:underline"
          >
            {t("auth.registerBtn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
