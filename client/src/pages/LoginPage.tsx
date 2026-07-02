import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

export const LoginPage = () => {
  const { login, register: signUp } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form hooks
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const onLoginSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      navigate("/", { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Invalid credentials. Please try again.");
    }
  };

  const onSignupSubmit = async (values: SignupValues) => {
    setFormError(null);
    try {
      await signUp(values.email, values.password, values.name);
      navigate("/", { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to create account. Try again.");
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? "Create account" : "Sign in"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Join the COSEKE scoring platform to view metrics."
              : "Sign in to the COSEKE scoring model."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSignUp ? (
            /* Signup Form */
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} noValidate>
              <FieldGroup>
                <Field data-invalid={!!signupForm.formState.errors.name}>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    aria-invalid={!!signupForm.formState.errors.name}
                    {...signupForm.register("name")}
                  />
                  <FieldError
                    errors={
                      signupForm.formState.errors.name
                        ? [signupForm.formState.errors.name]
                        : undefined
                    }
                  />
                </Field>

                <Field data-invalid={!!signupForm.formState.errors.email}>
                  <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!signupForm.formState.errors.email}
                    {...signupForm.register("email")}
                  />
                  <FieldError
                    errors={
                      signupForm.formState.errors.email
                        ? [signupForm.formState.errors.email]
                        : undefined
                    }
                  />
                </Field>

                <Field data-invalid={!!signupForm.formState.errors.password}>
                  <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!signupForm.formState.errors.password}
                    {...signupForm.register("password")}
                  />
                  <FieldError
                    errors={
                      signupForm.formState.errors.password
                        ? [signupForm.formState.errors.password]
                        : undefined
                    }
                  />
                </Field>

                <Field data-invalid={!!signupForm.formState.errors.confirmPassword}>
                  <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!signupForm.formState.errors.confirmPassword}
                    {...signupForm.register("confirmPassword")}
                  />
                  <FieldError
                    errors={
                      signupForm.formState.errors.confirmPassword
                        ? [signupForm.formState.errors.confirmPassword]
                        : undefined
                    }
                  />
                </Field>

                {formError && (
                  <p role="alert" className="text-sm text-destructive">
                    {formError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={signupForm.formState.isSubmitting}
                  className="w-full"
                >
                  {signupForm.formState.isSubmitting ? "Creating account…" : "Create account"}
                </Button>

                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setFormError(null);
                      signupForm.reset();
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </FieldGroup>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} noValidate>
              <FieldGroup>
                <Field data-invalid={!!loginForm.formState.errors.email}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!loginForm.formState.errors.email}
                    {...loginForm.register("email")}
                  />
                  <FieldError
                    errors={
                      loginForm.formState.errors.email
                        ? [loginForm.formState.errors.email]
                        : undefined
                    }
                  />
                </Field>

                <Field data-invalid={!!loginForm.formState.errors.password}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!loginForm.formState.errors.password}
                    {...loginForm.register("password")}
                  />
                  <FieldError
                    errors={
                      loginForm.formState.errors.password
                        ? [loginForm.formState.errors.password]
                        : undefined
                    }
                  />
                </Field>

                {formError && (
                  <p role="alert" className="text-sm text-destructive">
                    {formError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loginForm.formState.isSubmitting}
                  className="w-full"
                >
                  {loginForm.formState.isSubmitting ? "Signing in…" : "Sign in"}
                </Button>

                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setFormError(null);
                      loginForm.reset();
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Don't have an account? Create one
                  </button>
                </div>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default LoginPage;
