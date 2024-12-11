import { AfterViewInit, Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastService } from '../../services/toast.service';
import { ChannelService } from '../../services/channels.service';
import { AuthService } from '../../services/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-channel-application-modal',
  templateUrl: './channel-application-modal.component.html',
  styleUrls: ['./channel-application-modal.component.scss'],
})
export class ChannelApplicationModalComponent implements AfterViewInit {
  selectedFile: any;
  myProp: string;
  hasDisplayedError = false;
  profileId: number;
  originUrl = environment.conferenceUrl;
  link: string = '';
  userForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    channelName: new FormControl('', [Validators.required]),
    topics_covered: new FormControl('', [Validators.required]),
    bitChuteUrl: new FormControl(''),
    rumbleUrl: new FormControl(''),
    youtubeUrl: new FormControl(''),
    otherUrl: new FormControl(''),
  },{
    validators: this.onlyOneUrlValidator()
  });
  constructor(
    private spinner: NgxSpinnerService,
    public toastService: ToastService,
    public activateModal: NgbActiveModal,
    private channelService: ChannelService,
    public authService: AuthService
  ) {}
  ngAfterViewInit(): void {
    this.authService.loggedInUser$.subscribe((data) => {
      this.profileId = data?.profileId;
      this.userForm.get('username').setValue(data?.Username);
      this.userForm.get('email').setValue(data?.Email);
    });
  }

  ngOnInit(): void {}

  slugify = (str: string) => {
    return str?.length > 0
      ? str
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      : '';
  };

  resetForm(): void {
    this.userForm.reset();
  }

  saveChanges(): void {
    const { bitChuteUrl, rumbleUrl, youtubeUrl, otherUrl } = this.userForm.value;
    if (!(bitChuteUrl || rumbleUrl || youtubeUrl || otherUrl)) {
      return this.toastService.danger('Please enter at least one URL');
    }
    if (this.userForm?.errors?.invalidUrls) {
      const invalidFields = this.userForm.errors.invalidUrls.map(field => {
      switch (field) {
        case 'bitChuteUrl': return 'BitChute URL';
        case 'rumbleUrl': return 'Rumble URL';
        case 'youtubeUrl': return 'YouTube URL';
        case 'otherUrl': return 'Other URL';
        default: return field;
      }
    }).join(', ');
    this.toastService.danger(`Invalid URL(s): ${invalidFields}. Please enter valid URL(s).`);
    return;
  }
    if (this.userForm.valid) {
      this.channelService.createApplication(this.userForm.value).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          this.activateModal.close('success');
          this.toastService.success(res.message);
        },
        error: (err) => {
          this.spinner.hide();
          console.log(err);
        },
      });
     } else {
      this.toastService.danger('Please enter valid details');
    }
  }

  onlyOneUrlValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const urlPattern = new RegExp('(https?://|www\\.)[^\\s<&]+(?:\\.[^\\s<&]+)+');
      const urlControls = {
        bitChuteUrl: formGroup.get('bitChuteUrl'),
        rumbleUrl: formGroup.get('rumbleUrl'),
        youtubeUrl: formGroup.get('youtubeUrl'),
        otherUrl: formGroup.get('otherUrl'),
      };
      Object.values(urlControls).forEach(control => control?.setErrors(null));
      const invalidUrls = Object.entries(urlControls).filter(([key, control]) => {
        const isInvalid = control?.value?.trim() && !urlPattern.test(control.value);
        if (isInvalid) {
          control?.setErrors({ invalidUrl: true });
        }
        return isInvalid;
      }).map(([key]) => key);
      if (invalidUrls.length > 0) {
        return { invalidUrls };
      }
      return null;
    };
  }
}
