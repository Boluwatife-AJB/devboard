import SignUpForm from "@/components/forms/sign-up-form";

export default function SignUp() {
  return (
    <div className="flex h-[min(680px,calc(100dvh-7rem))] w-full max-w-md flex-col overflow-hidden rounded-xs border-2 border-devboard-primary/20 bg-primary/10 px-8 py-10">
      <SignUpForm />
    </div>
  );
}
