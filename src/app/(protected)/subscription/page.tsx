import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";

import { SubscriptionPlan } from "./_components/subscription-plan";

const SubsctriptionPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Assinatura</PageTitle>
          <PageDescription>Gerencie a sua assinatura</PageDescription>
        </PageHeaderContent>
      </PageHeader>

      <PageContent>
        <SubscriptionPlan
          className="w-[350px]"
          active={false}
          userEmail="glauber@email.com"
        />
      </PageContent>
    </PageContainer>
  );
};

export default SubsctriptionPage;
