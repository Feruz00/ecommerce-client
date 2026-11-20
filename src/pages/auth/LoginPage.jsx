import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "../../components/Seo";
import { useLogin } from "./hooks";

export default function LoginPage() {
  const { t } = useTranslation();
  const loginMut = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    loginMut.mutate(
      { username, password },
      {
        onError: (err) =>
          setError(err?.response?.data?.message || t("auth.loginError")),
      },
    );
  };

  return (
    <div className="container-main flex justify-center py-16">
      <Seo title={t("auth.loginTitle")} noindex path="/login" />

      <div className="bg-white w-full max-w-[400px] p-7 rounded-2xl border border-slate-200 shadow-card">
        <h1 className="text-xl font-bold mb-1">{t("auth.loginTitle")}</h1>

        <p className="text-sm text-slate-500 mb-5">{t("auth.loginSubtitle")}</p>

        <form onSubmit={onSubmit} className="space-y-4">
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
              placeholder={t("auth.password")}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loginMut.isPending}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loginMut.isPending ? t("common.loading") : t("auth.loginBtn")}
          </button>
        </form>

        <p className="text-sm text-center text-slate-500 mt-4">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="text-primary font-medium">
            {t("auth.registerBtn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
