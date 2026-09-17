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

import type {
  StructuredResume,
} from "@/types/resume";

export default function CreateAccountPage() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] =
    useState("");

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
    googleLoading,
    setGoogleLoading,
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

  const [
    foundResume,
    setFoundResume,
  ] =
    useState(false);

  const [
    resumeName,
    setResumeName,
  ] =
    useState("");

  /*
    Se a pessoa já criou ou importou
    um currículo-base neste navegador,
    reaproveitamos o e-mail e o nome.
  */

  useEffect(() => {
    try {
      const savedResume =
        localStorage.getItem(
          "resume-match-structured-resume",
        );

      if (!savedResume) {
        return;
      }

      const parsed =
        JSON.parse(
          savedResume,
        ) as StructuredResume;

      setFoundResume(true);

      if (
        parsed.name
      ) {
        setResumeName(
          parsed.name,
        );
      }

      if (
        parsed.contact?.email
      ) {
        setEmail(
          parsed.contact.email,
        );
      }
    } catch (
      loadError
    ) {
      console.error(
        "Erro ao carregar currículo local:",
        loadError,
      );
    }
  }, []);

  async function handleCreateAccount(
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

    if (
      password.length < 8
    ) {
      setError(
        "Sua senha precisa ter pelo menos 8 caracteres.",
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
        data,
        error:
          signUpError,
      } =
        await supabase.auth.signUp({
          email:
            cleanEmail,

          password,

          options: {
            data: {
              name:
                resumeName ||
                undefined,
            },
          },
        });

      if (
        signUpError
      ) {
        if (
          signUpError.message
            .toLowerCase()
            .includes(
              "already registered",
            )
        ) {
          setError(
            "Já existe uma conta com este e-mail. Tente entrar.",
          );
        } else {
          setError(
            "Não foi possível criar sua conta. Tente novamente.",
          );
        }

        return;
      }

      /*
        Dependendo da configuração
        do Supabase, o cadastro pode:

        1. criar uma sessão imediatamente;
        ou
        2. exigir confirmação por e-mail.
      */

      if (
        data.session
      ) {
        router.push(
          "/dashboard",
        );

        return;
      }

      setSuccess(
        "Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre no Resume Match.",
      );
    } catch (
      createError
    ) {
      console.error(
        createError,
      );

      setError(
        "Não foi possível criar sua conta. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError("");
    setSuccess("");
    setGoogleLoading(true);

    try {
      const {
        error:
          googleError,
      } =
        await supabase.auth.signInWithOAuth({
          provider:
            "google",

          options: {
            redirectTo:
              `${window.location.origin}/dashboard`,
          },
        });

      if (
        googleError
      ) {
        throw googleError;
      }
    } catch (
      googleSignupError
    ) {
      console.error(
        "Erro ao continuar com Google:",
        googleSignupError,
      );

      setError(
        "Não foi possível continuar com Google. Tente novamente.",
      );

      setGoogleLoading(
        false,
      );
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
            Já tenho conta
          </a>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-81px)] max-w-[1280px] items-center justify-center px-6 py-12">
        <div className="w-full max-w-[460px]">
          <div className="mb-8">
            <div className="inline-flex items-center rounded-full border border-[#F0C8D2] bg-[#FFF0F4] px-3 py-1 text-xs font-semibold text-[#C23F61]">
              Beta
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
              Salve seu progresso.
            </h1>

            <p className="mt-4 text-base leading-7 text-[#686864]">
              Crie sua conta para acessar seu currículo-base e suas candidaturas em outros momentos.
            </p>
          </div>

          {foundResume && (
            <div className="mb-5 rounded-xl border border-[#CFE3D8] bg-[#F4FAF6] px-5 py-4">
              <p className="text-sm font-semibold text-[#247A52]">
                Seu currículo já está pronto
              </p>

              <p className="mt-1 text-sm leading-6 text-[#5F6F65]">
                Encontramos as informações que você já preencheu neste navegador.
                Você não precisa criar seu currículo novamente.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-[#DEDEDA] bg-white p-6 sm:p-8">
            <button
              type="button"
              onClick={
                handleGoogleSignup
              }
              disabled={
                googleLoading ||
                loading
              }
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#CBCBC5] bg-white px-5 text-sm font-semibold text-[#181818] transition enabled:hover:bg-[#F7F7F5] disabled:cursor-wait disabled:opacity-60"
            >
              <GoogleIcon />

              {googleLoading
                ? "Conectando com Google..."
                : "Continuar com Google"}
            </button>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#E5E5E1]" />

              <span className="text-xs text-[#999994]">
                ou
              </span>

              <div className="h-px flex-1 bg-[#E5E5E1]" />
            </div>

            <form
              onSubmit={
                handleCreateAccount
              }
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  E-mail
                </span>

                <input
                  type="email"
                  required
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

                {foundResume &&
                  email && (
                    <p className="mt-2 text-xs leading-5 text-[#777772]">
                      Preenchemos com o e-mail encontrado no seu currículo. Você pode alterar se preferir usar outro e-mail para entrar.
                    </p>
                  )}
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-medium">
                  Crie uma senha
                </span>

                <input
                  type="password"
                  required
                  minLength={
                    8
                  }
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
                  Confirme sua senha
                </span>

                <input
                  type="password"
                  required
                  minLength={
                    8
                  }
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
                  <p className="text-sm font-medium text-[#B83A3A]">
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

              {!success && (
                <button
                  type="submit"
                  disabled={
                    loading ||
                    googleLoading
                  }
                  className="mt-6 h-12 w-full rounded-lg bg-[#181818] px-5 text-sm font-semibold text-white transition enabled:hover:bg-black disabled:cursor-wait disabled:bg-[#777772]"
                >
                  {loading
                    ? "Criando conta..."
                    : "Criar minha conta"}
                </button>
              )}
            </form>

            {success && (
              <a
                href="/entrar"
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#181818] px-5 text-sm font-semibold text-white transition hover:bg-black"
              >
                Ir para o login
              </a>
            )}

            <div className="mt-6 border-t border-[#E7E7E3] pt-6">
              <p className="text-center text-sm text-[#686864]">
                Já tem uma conta?{" "}
                <a
                  href="/entrar"
                  className="font-semibold text-[#181818] underline underline-offset-4"
                >
                  Entrar
                </a>
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#DEDEDA] bg-white px-5 py-4">
            <div className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 shrink-0 items-center rounded-md bg-[#FFF0F4] px-2 text-[11px] font-bold text-[#C23F61]">
                BETA
              </span>

              <div>
                <p className="text-sm font-semibold">
                  Gratuito durante os testes
                </p>

                <p className="mt-1 text-sm leading-6 text-[#777772]">
                  O Resume Match está em beta. Estamos testando e aprimorando o produto e, durante esta fase, você não será cobrado pelo uso.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-[#999994]">
            Ao criar sua conta, você concorda em utilizar o Resume Match durante seu período de testes.
          </p>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.909c1.702-1.567 2.684-3.876 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.468-.806 5.956-2.18l-2.909-2.258c-.806.54-1.836.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.963 10.707A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.167.281-1.707V4.961H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.039l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.579c1.321 0 2.507.454 3.441 1.346l2.581-2.582C13.464.891 11.426 0 9 0A9 9 0 0 0 .956 4.961l3.007 2.332C4.672 5.164 6.656 3.579 9 3.579Z"
      />
    </svg>
  );
}

