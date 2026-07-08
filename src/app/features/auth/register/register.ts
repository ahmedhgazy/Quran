import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable, of, timer } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.html',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: [
        '',
        {
          validators: [Validators.required, Validators.email],
          asyncValidators: [this.emailAvailableValidator()],
          updateOn: 'change',
        },
      ],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [this.passwordMatchValidator],
    },
  );

  protected readonly passwordValue = toSignal(this.form.controls.password.valueChanges, {
    initialValue: '',
  });

  protected readonly passwordStrength = computed(() => {
    const pw = this.passwordValue();
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  });

  protected readonly passwordStrengthLabel = computed(() => {
    const score = this.passwordStrength();
    if (!this.passwordValue()) return '';
    switch (score) {
      case 1:
        return 'AUTH.PASSWORD_STRENGTH_WEAK';
      case 2:
        return 'AUTH.PASSWORD_STRENGTH_FAIR';
      case 3:
        return 'AUTH.PASSWORD_STRENGTH_GOOD';
      case 4:
        return 'AUTH.PASSWORD_STRENGTH_STRONG';
      default:
        return 'AUTH.PASSWORD_STRENGTH_WEAK';
    }
  });

  protected readonly passwordStrengthColor = computed(() => {
    const score = this.passwordStrength();
    switch (score) {
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-emerald-500';
      default:
        return 'bg-slate-200 dark:bg-slate-800';
    }
  });

  private emailAvailableValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.hasError('email')) {
        return of(null);
      }
      return timer(500).pipe(
        switchMap(() => this.auth.checkEmail(control.value)),
        map((res) => (res.exists ? { emailExists: true } : null)),
        catchError(() => of(null)),
      );
    };
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    const { username, email, password } = this.form.getRawValue();
    this.auth.register(username, email, password);
  }
}
