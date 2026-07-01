"use client";

import { useMemo } from "react";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: "", color: "" };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };

    Object.values(checks).forEach((check) => {
      if (check) score++;
    });

    if (score <= 1) {
      return { level: 1, label: "Weak", color: "#ff6b6b", checks };
    } else if (score <= 2) {
      return { level: 2, label: "Fair", color: "#ffa500", checks };
    } else if (score <= 3) {
      return { level: 3, label: "Good", color: "#ffd700", checks };
    } else if (score <= 4) {
      return { level: 4, label: "Strong", color: "#90ee90", checks };
    } else {
      return { level: 5, label: "Very Strong", color: "#00c853", checks };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full bg-border/30 transition-all duration-300"
            style={{
              backgroundColor:
                i <= strength.level ? strength.color : "rgb(51, 52, 60)",
              opacity: i <= strength.level ? 1 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Strength Label & Checklist */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Password Strength
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: strength.color }}
          >
            {strength.label}
          </span>
        </div>

        {/* Requirements Checklist */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: strength.checks?.length
                  ? strength.color
                  : "rgb(70, 69, 84)",
              }}
            >
              {strength.checks?.length && (
                <span className="text-white text-[10px]">✓</span>
              )}
            </div>
            <span
              className={
                strength.checks?.length
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              8+ characters
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: strength.checks?.uppercase
                  ? strength.color
                  : "rgb(70, 69, 84)",
              }}
            >
              {strength.checks?.uppercase && (
                <span className="text-white text-[10px]">✓</span>
              )}
            </div>
            <span
              className={
                strength.checks?.uppercase
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              Uppercase letter
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: strength.checks?.lowercase
                  ? strength.color
                  : "rgb(70, 69, 84)",
              }}
            >
              {strength.checks?.lowercase && (
                <span className="text-white text-[10px]">✓</span>
              )}
            </div>
            <span
              className={
                strength.checks?.lowercase
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              Lowercase letter
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: strength.checks?.number
                  ? strength.color
                  : "rgb(70, 69, 84)",
              }}
            >
              {strength.checks?.number && (
                <span className="text-white text-[10px]">✓</span>
              )}
            </div>
            <span
              className={
                strength.checks?.number
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              Number
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: strength.checks?.special
                  ? strength.color
                  : "rgb(70, 69, 84)",
              }}
            >
              {strength.checks?.special && (
                <span className="text-white text-[10px]">✓</span>
              )}
            </div>
            <span
              className={
                strength.checks?.special
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              Special character
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
