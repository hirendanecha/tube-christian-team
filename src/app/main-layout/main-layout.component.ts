import { Component, OnInit } from '@angular/core';
import { ShareService } from '../@shared/services/share.service';
import { BreakpointService } from '../@shared/services/breakpoint.service';
import { environment } from 'src/environments/environment';
import { CommonService } from '../@shared/services/common.service';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../@shared/services/auth.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  tokenData: any;
  constructor(
    public shareService: ShareService,
    public breakpointService: BreakpointService,
    private commonService: CommonService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    private cookieService: CookieService,
    private route: ActivatedRoute
  ) {
    const queryParams = this.route.snapshot.queryParams;
    const newParams = { ...queryParams };
    if (newParams['authToken']) {
      const token = newParams['authToken'];
      this.authService.setToken(token);
      if (newParams['channelId']) {
        localStorage.setItem('channelId', newParams['channelId']);
      }
      setTimeout(() => {
        delete newParams['authToken'];
        const navigationExtras: NavigationExtras = {
          queryParams: newParams,
        };
        this.router.navigate([], navigationExtras);
      }, 1000);
    }
  }

  ngOnInit(): void {
    this.spinner.show();
    const url = environment.apiUrl + 'login/me';
    this.commonService
      .get(`${url}?q=${Date.now()}`, {
        // withCredentials: true,
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      })
      .subscribe({
        next: (res) => {
          this.spinner.hide();
          // console.log(res);
          // this.authService.setUserData(res);
          this.authService.getLoginUserDetails(res);
          this.shareService.updateMediaApproved(res?.MediaApproved);
        },
        error: (err) => {
          this.spinner.hide();
          localStorage.clear();
          // const url = environment.apiUrl + 'customers/logout';
          // location.href = environment.logoutUrl;
          // this.commonService.get(url).subscribe({
          //   next: (res) => {
          //   },
          // });
          // console.log(err);
        },
      });
  }
}
