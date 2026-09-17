"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "@/lib/supabase/client";

export default function NewPasswordPage() {
  const router =
    useRouter();

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    checkingSession,
    setCheckingSession,
  ] =
    useState(true);

  const [
    validSession,
    setValidSession,
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

  useEffect(() => {
    let active =
      true;

    async function checkRecoverySession() {
      /*
        Quando a pessoa abre o link enviado
        pelo Supabase, a sessão de recuperação
        é criada automaticamente no navegador.
      */

      const {
        data: {
          session,
        },
        error:
          sessionError,
      } =
        await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (
        sessionError ||
        !session
      ) {
        setValidSession(
          false,
        );

        setCheckingSession(
          false,
        );

        return;
      }

      setValidSession(
        true,
      );

      setCheckingSession(
        false,
      );
    }

    checkRecoverySession();

    return () => {
      active =
        false;
    };
  }, []);

  async function handleUpdatePassword(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      password.length <
      8
    ) {
      setError(
        "Sua nova senha precisa ter pelo menos 8 caracteres.",
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "As senhas não são iguais.",
      );

      return;
    }

    setLoading(true);

    try {
      const {
        error:
          updateError,
      } =
        await supabase.auth.updateUser({
          password,
        });

      if (
        updateError
      ) {
        throw updateError;
      }

      setSuccess(
        "Sua senha foi alterada com sucesso.",
      );

      window.setTimeout(
        () => {
          router.push(
            "/dashboard",
          );
        },
        1200,
      );
    } catch (
      updatePasswordError
    ) {
      console.error(
        "Erro ao atualizar senha:",
        updatePasswordError,
      );

      setError(
        "Não foi possível alterar sua senha. Solicite um novo link de recuperação e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (
    checkingSession
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] text-[#181818]">
        <div className="text-center">
          <p className="text-sm font-semibold">
            Verificando link...
          </p>

          <p className="mt-2 text-sm text-[#777772]">
            Aguarde um instante.
          </p>
        </div>
      </main>
    );
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
              Crie uma nova senha.
            </h1>

            <p className="mt-4 text-base leading-7 text-[#686864]">
              Escolha uma nova senha para continuar acessando sua conta.
            </p>
          </div>

          {!validSession ? (
            <div className="rounded-2xl border border-[#DEDEDA] bg-white p-6 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF0F2] text-lg font-semibold text-[#B83F55]">
                !
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                Link inválido ou expirado
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#686864]">
                Este link de recuperação não está mais válido. Solicite um novo link para redefinir sua senha.
              </p>

              <a
                href="/recuperar-senha"
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#181818] px-5 text-sm font-semibold text-white transition hover:bg-black"
              >
                Solicitar novo link
              </a>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#DEDEDA] bg-white p-6 sm:p-8">
              <form
                onSubmit={
                  handleUpdatePassword
                }
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Nova senha
                  </span>

                  <input
                    type="password"
                    required
                    minLength={
                      8
                    }
                    autoComplete="new-password"
                    value={
                      password
                    }
                    onChange={(
                      event,
                    ) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Mínimo de 8 caracteres"
                    className="h-12 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none transition focus:border-[#181818]"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-medium">
                    Confirme a nova senha
                  </span>

                  <input
                    type="password"
                    required
                    minLength={
                      8
                    }
                    autoComplete="new-password"
                    value={
                      confirmPassword
                    }
                    onChange={(
                      event,
                    ) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Digite novamente"
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

                {success && (
                  <div className="mt-5 rounded-lg bg-[#F0F8F3] px-4 py-3">
                    <p className="text-sm font-medium leading-6 text-[#247A52]">
                      {success}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    Boolean(
                      success,
                    )
                  }
                  className="mt-6 h-12 w-full rounded-lg bg-[#181818] px-5 text-sm font-semibold text-white transition enabled:hover:bg-black disabled:cursor-wait disabled:bg-[#777772]"
                >
                  {loading
                    ? "Salvando..."
                    : success
                      ? "Senha alterada"
                      : "Salvar nova senha"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}