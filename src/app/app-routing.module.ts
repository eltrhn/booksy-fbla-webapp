import { NgModule } from '@angular/core';
import { RouterModule, Routes, ExtraOptions } from '@angular/router';

import { AuthGuard } from './auth.guard';

import { AboutComponent } from './about/about.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomePageComponent } from './home-page/home-page.component';
import { HelpComponent } from './help/help.component';
import { HelpViewComponent } from './help-view/help-view.component';
import { LocationEditComponent } from './location-edit/location-edit.component';
import { LocationMgmtComponent } from './location-mgmt/location-mgmt.component';
import { LoginComponent } from './login/login.component';
import { MediaEditComponent } from './media-edit/media-edit.component';
import { MediaInfoComponent } from './media-info/media-info.component';
import { MediaSearchComponent } from './media-search/media-search.component';
import { MemberAcctInfoComponent } from './member-acct-info/member-acct-info.component';
import { MgmtAccountsComponent } from './mgmt-accounts/mgmt-accounts.component';
import { MgmtRolesPermsComponent } from './mgmt-roles-perms/mgmt-roles-perms.component';
import { PersonalHoldsComponent } from './personal-holds/personal-holds.component';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { PersonalMediaComponent } from './personal-media/personal-media.component';
import { ReportsComponent } from './reports/reports.component';
import { ReportViewComponent } from './report-view/report-view.component';
import { RoleDetailComponent } from './role-detail/role-detail.component';
import { ReroutingComponent } from './rerouting/rerouting.component';
import { SignupComponent } from './signup/signup.component';
import {
  MgmtMediaComponent,
  MgmtMediaListComponent,
  MgmtMediaGenresComponent
} from './mgmt-media/mgmt-media.component';
import {
  MgmtMediaTypesComponent,
  MediaTypeDetailComponent,
} from './mgmt-media/mgmt-media-types.component';

const routes: Routes = [
  {path: 'signup', component: SignupComponent},
  {path: 'login', component: LoginComponent},
  {path: '', redirectTo: 'home', pathMatch: 'full', canActivate: [AuthGuard]},
  {path: 'index.html', component: ReroutingComponent},
  {path: 'home', canActivate: [AuthGuard], component: HomePageComponent, children: [
    // routed to by the sidebar
    {path: '', redirectTo: 'checkout', pathMatch: 'full'},
    {path: 'media/search', component: MediaSearchComponent},
    {path: 'media/manage', component: MgmtMediaComponent, children: [
      {path: '', redirectTo: 'list', pathMatch: 'full'},
      {path: 'list', component: MgmtMediaListComponent},
      {path: 'types/:name', component: MediaTypeDetailComponent},
      {path: 'types', component: MgmtMediaTypesComponent},
      {path: 'genres', component: MgmtMediaGenresComponent}
    ]},
    {path: 'media/edit/:mID', component: MediaEditComponent},
    {path: 'media/:mID', component: MediaInfoComponent},
    {path: 'roles/:rID', component: RoleDetailComponent},
    {path: 'account', component: PersonalInfoComponent},
    {path: 'members/:uID', component: MemberAcctInfoComponent},
    {path: 'checkout', component: CheckoutComponent},
    {path: 'dashboard', component: DashboardComponent, children: [
      {path: '', redirectTo: 'items', pathMatch: 'full'},
      {path: 'items', component: PersonalMediaComponent},
      {path: 'holds', component: PersonalHoldsComponent},
      {path: ':uID/items', component: PersonalMediaComponent},
      {path: ':uID/holds', component: PersonalHoldsComponent},
    ]},
    {path: 'reports/view', component: ReportViewComponent}, // this won't work as a child for some reason ... even though it well should
    {path: 'reports', component: ReportsComponent},
    {path: 'manage', component: LocationMgmtComponent, children: [
      {path: '', redirectTo: 'location', pathMatch: 'full'},
      {path: 'location', component: LocationEditComponent},
      {path: 'accounts', component: MgmtAccountsComponent},
      {path: 'roles', component: MgmtRolesPermsComponent}
    ]},
  ]},
  {path: 'help/:id', component: HelpViewComponent},
  {path: 'help', component: HelpComponent},
  {path: 'about', component: AboutComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule {}
