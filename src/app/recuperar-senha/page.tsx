"use client";

import {
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase/client";

export default function RecoverPasswordPage() {
  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  async function handleRecoverPassword(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (!cleanEmail) {
      setError(
        "Informe seu e-mail.",
      );

      return;
    }

    setLoading(true);

    try {
      const {
        error:
          recoverError,
      } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              `${window.location.origin}/nova-senha`,
          },
        );

      if (
        recoverError
      ) {
        throw recoverError;
      }

      setSuccess(
        "Enviamos um link para redefinir sua senha. Confira sua caixa de entrada e também a pasta de spam.",
      );
    } catch (
      recoverError
    ) {
      console.error(
        "Erro ao recuperar senha:",
        recoverError,
      );

      setError(
        "Não foi possível enviar o e-mail de recuperação. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#181818]">
      <header className="border-b border-[#DEDEDA] bg-white">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6 lg:px-10">
          <a href="/">
            <img
              src="/brand/resume-match-logo-horizontal.svg"
              alt="Resume Match"
              className="h-9 w-auto"
            />
          </a>

          <a
            href="/entrar"
            className="text-sm font-medium text-[#686864] transition hover:text-[#181818]"
          >
            Voltar para o login
          </a>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-81px)] max-w-[1280px] items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-8">
            <div className="inline-flex items-center rounded-full border border-[#F0C8D2] bg-[#FFF0F4] px-3 py-1 text-xs font-semibold text-[#C23F61]">
              Resume Match
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
              Recupere sua senha.
            </h1>

            <p className="mt-4 text-base leading-7 text-[#686864]">
              Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.
            </p>
          </div>

          <div className="rounded-2xl border border-[#DEDEDA] bg-white p-6 sm:p-8">
            {!success ? (
              <form
                onSubmit={
                  handleRecoverPassword
                }
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    E-mail
                  </span>

                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={
                      email
                    }
                    onChange={(
                      event,
                    ) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    placeholder="voce@email.com"
                    className="h-12 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none transition focus:border-[#181818]"
                  />
                </label>

                {error && (
                  <div className="mt-5 rounded-lg bg-[#FFF0F0] px-4 py-3">
                    <p className="text-sm font-medium leading-6 text-[#B83A3A]">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="mt-6 h-12 w-full rounded-lg bg-[#181818] px-5 text-sm font-semibold text-white transition enabled:hover:bg-black disabled:cursor-wait disabled:bg-[#777772]"
                >
                  {loading
                    ? "Enviando..."
                    : "Enviar link de recuperação"}
                </button>
              </form>
            ) : (
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF5EE] text-lg font-semibold text-[#247A52]">
                  ✓
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  Confira seu e-mail
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#686864]">
                  {success}
                </p>

                <p className="mt-3 break-all text-sm font-medium">
                  {email}
                </p>

                <a
                  href="/entrar"
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg border border-[#CBCBC5] bg-white px-5 text-sm font-semibold transition hover:bg-[#F7F7F5]"
                >
                  Voltar para o login
                </a>
              </div>
            )}
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-[#999994]">
            Por segurança, não informamos se um e-mail possui ou não uma conta cadastrada.
          </p>
        </div>
      </div>
    </main>
  );
}