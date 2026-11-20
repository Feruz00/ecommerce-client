import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "../../components/Seo";
import { useRegister } from "./hooks";

export default function RegisterPage() {
  const { t } = useTranslation();
  const regMut = useRegister();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [error, setError] = useState("");

  const set = (key) => (e) =>
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    regMut.mutate(form, {
      onError: (err) =>
        setError(err?.response?.data?.message || t("auth.registerError")),
    });
  };

  return (
    <div className="container-main flex justify-center py-16">
      <Seo title={t("auth.registerTitle")} noindex path="/register" />

      <div className="bg-white w-full max-w-[420px] p-7 rounded-2xl border border-slate-200 shadow-card">
        <h1 className="text-xl font-bold mb-1">{t("auth.registerTitle")}</h1>

        <p className="text-sm text-slate-500 mb-5">
          {t("auth.registerSubtitle")}
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium mb-1.5">
                {t("auth.firstName")}
              </label>

              <input
                type="text"
                required
                autoComplete="given-name"
                value={form.first_name}
                onChange={set("first_name")}
                placeholder={t("auth.firstName")}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1.5">
                {t("auth.lastName")}
              </label>

              <input
                type="text"
                required
                autoComplete="family-name"
                value={form.last_name}
                onChange={set("last_name")}
                placeholder={t("auth.lastName")}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1.5">
              {t("auth.email")}
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              placeholder={t("auth.email")}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1.5">
              {t("auth.phone")}
            </label>

            <input
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder={t("auth.phone")}
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
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              placeholder={t("auth.password")}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={regMut.isPending}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {regMut.isPending ? t("common.loading") : t("auth.registerBtn")}
          </button>
        </form>

        <p className="text-sm text-center text-slate-500 mt-4">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="text-primary font-medium">
            {t("auth.loginBtn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
