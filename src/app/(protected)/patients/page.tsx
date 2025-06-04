import {
  PageActions,
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";

import { AddPatientButton } from "./_components/add-patient-button";

const PatientsPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Pacientes</PageTitle>
          <PageDescription>
            Gerencie os pacientes da sua clínica
          </PageDescription>
        </PageHeaderContent>

        <PageActions>
          <AddPatientButton />
        </PageActions>
      </PageHeader>
    </PageContainer>
  );
};

export default PatientsPage;
