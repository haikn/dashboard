import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusLabel',
})
export class StatusLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    switch (value) {
      case 'planned':
        return 'Planned';
      case 'in-progress':
        return 'In progress';
      case 'completed':
        return 'Completed';
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'busy':
        return 'Busy';
      default:
        return value ?? '';
    }
  }
}
