import type { Patient, PatientTooth } from '../entities/index.js';
import type { RepositoryBundle } from '../repositories/types.js';
import { toISO } from '../utils/datetime.js';
import { AuditService } from './auditService.js';

export interface CreatePatientInput {
  fullNameAr: string;
  fullNameEn?: string;
  gender: 'male' | 'female';
  dob?: string;
  phone?: string;
  address?: string;
  notesMedical?: string;
  doctorId?: string;
}

export interface UpdatePatientInput extends Partial<CreatePatientInput> {}

export class PatientService {
  constructor(private readonly repositories: RepositoryBundle, private readonly auditService: AuditService) {}

  private async nextPatientCode(): Promise<string> {
    const all = await this.repositories.patients.list();
    const year = new Date().getFullYear();
    const sequence = String(all.length + 1).padStart(4, '0');
    return `PT-${year}-${sequence}`;
  }

  async create(input: CreatePatientInput): Promise<Patient> {
    const patient = await this.repositories.patients.create({
      code: await this.nextPatientCode(),
      fullNameAr: input.fullNameAr,
      fullNameEn: input.fullNameEn,
      gender: input.gender,
      dob: input.dob ? toISO(input.dob) : undefined,
      phone: input.phone,
      address: input.address,
      notesMedical: input.notesMedical,
      doctorId: input.doctorId
    });
    await this.auditService.log('create', 'patient', patient.id, { patient });
    return patient;
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    const patient = await this.repositories.patients.update(id, {
      ...input,
      dob: input.dob ? toISO(input.dob) : undefined
    });
    await this.auditService.log('update', 'patient', id, { changes: input });
    return patient;
  }

  async search(term: string): Promise<Patient[]> {
    return this.repositories.patients.search(term);
  }

  async attachFiles(patientId: string, files: { name: string; mimeType: string; size: number; dataUrl?: string }[]): Promise<void> {
    for (const file of files) {
      await this.repositories.attachments.create({
        ownerType: 'patient',
        ownerId: patientId,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        dataUrl: file.dataUrl
      });
    }
    await this.auditService.log('attach', 'patient', patientId, { files: files.map((file) => file.name) });
  }

  async getToothMap(patientId: string): Promise<PatientTooth[]> {
    return this.repositories.patientTeeth.findByPatient(patientId);
  }

  async setToothStatus(
    patientId: string,
    toothNumber: number,
    statusId: string,
    notes?: string
  ): Promise<PatientTooth> {
    const status = await this.repositories.toothStatuses.findById(statusId);
    if (!status) {
      throw new Error('حالة السن غير موجودة.');
    }
    const existing = await this.repositories.patientTeeth.findByPatientAndTooth(patientId, toothNumber);
    let tooth: PatientTooth;
    if (existing) {
      tooth = await this.repositories.patientTeeth.update(existing.id, {
        statusId,
        notes
      });
    } else {
      tooth = await this.repositories.patientTeeth.create({
        patientId,
        toothNumber,
        statusId,
        notes
      });
    }
    await this.auditService.log('set_tooth_status', 'patient', patientId, {
      toothNumber,
      statusId,
      notes
    });
    return tooth;
  }
}
