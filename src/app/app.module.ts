import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayerService } from './services/layer.service';
import { HttpClientModule } from '@angular/common/http';
import { LoadService } from './services/load.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [LayerService, LoadService],
  bootstrap: [AppComponent]
})
export class AppModule { }
