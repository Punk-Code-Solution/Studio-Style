import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label?: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

export interface Activity {
  title: string;
  time: Date;
  icon: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(dateRange: 'week' | 'month' | 'year'): Observable<DashboardStats[]> {
    return this.http.get<DashboardStats[]>(`${this.apiUrl}/stats`, {
      params: { dateRange }
    });
  }

  getSpecialtiesChartData(dateRange: 'week' | 'month' | 'year'): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/specialties`, {
      params: { dateRange }
    });
  }

  getAppointmentsChartData(dateRange: 'week' | 'month' | 'year'): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/appointments`, {
      params: { dateRange }
    });
  }

  getAgeChartData(dateRange: 'week' | 'month' | 'year'): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/age`, {
      params: { dateRange }
    });
  }

  getSatisfactionChartData(dateRange: 'week' | 'month' | 'year'): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/satisfaction`, {
      params: { dateRange }
    });
  }

  getRecentActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/activities`);
  }
} 