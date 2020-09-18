import { OnInit, Directive } from '@angular/core';
import { Observable } from 'rxjs';
import { AddToHomeScreenService } from '../services/add-to-home-screen.service';

@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class AddToHomeScreenComponent implements OnInit {
  canPrompt$: Observable<boolean>;
  constructor(protected addToHomeScreenService: AddToHomeScreenService) {}

  ngOnInit(): void {
    this.canPrompt$ = this.addToHomeScreenService.canPrompt$;
  }

  prompt(): void {
    this.addToHomeScreenService.firePrompt();
  }
}
