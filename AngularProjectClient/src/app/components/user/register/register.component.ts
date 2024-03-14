
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { UserService } from '../user.service';
import { emailValidator } from '../email-validation';
import { User } from '../../../models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  existingUser: boolean = false;
  name: string | null = null;
  hide: boolean = true;
  nextUserCode: number = 0;
  passwordStrength: string = '';

  constructor(private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private _userService: UserService) { }

  ngOnInit(): void {
    this.name = this.route.snapshot.queryParamMap.get('name');

    this._userService.getUsers().subscribe(users => {
      this.nextUserCode = users.length+1;
      console.log("get-name" ,this.nextUserCode);
      
    });

    this.registerForm = this.formBuilder.group({
      Id: [this.nextUserCode + 1],
      Name: [this.name || '', Validators.required],
      Address: ['', Validators.required],
      Email: ['', [Validators.required, Validators.email, emailValidator]],
      Password: ['', [Validators.required, Validators.minLength(4)]]
    });
    
    
    this.registerForm.get('Password')?.valueChanges.subscribe(value => {
      this.updatePasswordStrength();
    });

  }

  updatePasswordStrength() {
    const password = this.registerForm.get('Password')?.value;
    let strength = 'weak';

    if (password.length >= 8) {
      strength = 'medium';
    }

    if (password.match(/[A-Z]/) && password.match(/[a-z]/) && password.match(/[0-9]/) && password.match(/[@#$%^&*()<>{}]/)) {
      strength = 'strong';
    }

    this.passwordStrength = strength;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.registerForm.value.Id=this.nextUserCode;
      let u: User = this.registerForm.value ;
      // u.id=this.nextUserCode;
      this._userService.getUsers().subscribe({
        next: (res) => {
          this.existingUser = res.some((user) => user.password === this.registerForm.value.password);
          if (this.existingUser) {
            console.log("the user is exist");
            this.router.navigate(["/user/login"], { queryParams: { name: u.name } })
          }
          else {
            this._userService.addUser(u).subscribe({
              next: (res) => {
                sessionStorage.setItem('userId',JSON.stringify(this.nextUserCode)); 
                sessionStorage.setItem('user', JSON.stringify(u)); // Store user in session
                console.log("added successfully", res);
                this.router.navigate(['/recipe/recipes-list']);
              }
              , error: (err) => {
                console.log(err);
              }
            });
          }
        }
        , error: (err) => {
          console.log(err);
        }

      })
      this._userService.addUser(u);
      this._userService.getUsers().forEach((u) => console.log(u));

    }
  }
}
