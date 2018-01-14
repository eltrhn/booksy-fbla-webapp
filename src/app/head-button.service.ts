import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { catchError, map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

import { NavButton, httpOptions } from './classes';
import { LoggingService } from './logging.service';

@Injectable()
export class ButtonService {
  private buttonsURL = 'stock/headerbuttons';
  
  constructor(
    private loggingService: LoggingService,
    private http: HttpClient
  ) { }
  
  private log(message: string) {
    this.loggingService.add('ButtonService: ' + message);
  }
  
  getButtons(): Observable<NavButton[]> {
    return this.http.get<NavButton[]>(this.buttonsURL).pipe(
      tap(heroes => this.log(`Fetched buttons`)),
      catchError(this.handleError('getButtons', []))
    );
  }
  
  private handleError<T> (operation = 'operation', result ?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
  

}
