import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { ShareService } from './@shared/services/share.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from './@shared/services/auth.service';
import { CommonService } from './@shared/services/common.service';
import { CookieService } from 'ngx-cookie-service';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  isShowScrollTopBtn: boolean = false;

  constructor(
    public shareService: ShareService,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    private cookieService: CookieService,
    private route: ActivatedRoute
  ) { }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (window.scrollY > 100) {
      this.isShowScrollTopBtn = true;
    } else {
      this.isShowScrollTopBtn = false;
    }
  }

  ngOnInit(): void {
    const authToken = localStorage.getItem('auth-token');
    if (authToken) {
      this.authService.verifyToken(authToken).subscribe({
        next: (res: any) => {
          if (!res?.verifiedToken) {
            this.logOut();
          }
        },
        error: (err) => {
          this.logOut();
        },
      });
    } else {
      const authTokenFromCookie = this.getCookie('authToken');
      if (authTokenFromCookie) {
      this.authService.setToken(authTokenFromCookie);
      } else {
        console.log('Auth Token cookie not found.');
      }
    }
  }

  getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  ngAfterViewInit(): void {
    this.spinner.hide();
    setTimeout(() => {
      const splashScreenLoader = document.getElementById('splashScreenLoader');
      if (splashScreenLoader) {
        splashScreenLoader.style.display = 'none';
      }
    }, 0);
  }

  logOut(): void {
    this.cookieService.delete('auth-user', '/', environment.domain);
    this.cookieService.deleteAll();
    localStorage.clear();
    sessionStorage.clear();
    location.href = environment.logoutUrl;
    // const url = environment.apiUrl + 'customers/logout';
    // this.commonService.get(url).subscribe({
    //   next: (res) => {
    //   },
    // });
  }
}
