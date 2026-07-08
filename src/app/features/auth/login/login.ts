import { Component, ChangeDetectionStrategy, inject, signal, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';

declare var google: any;

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
})
export class LoginPage implements AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly error = signal('');
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      this.initGoogleSignIn();
    }
  }

  private initGoogleSignIn(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: '73583160367-4bia2hmh8fkp9hltpjalc44apqrj9mec.apps.googleusercontent.com',
        callback: (response: any) => {
          if (response?.credential) {
            this.auth.loginWithGoogle(response.credential);
          }
        },
      });
      google.accounts.id.renderButton(document.getElementById('google-btn'), {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
      });
    } else {
      setTimeout(() => this.initGoogleSignIn(), 250);
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password);
  }
}
