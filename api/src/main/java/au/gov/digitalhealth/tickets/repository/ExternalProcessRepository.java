package au.gov.digitalhealth.tickets.repository;

import au.gov.digitalhealth.tickets.models.ExternalProcess;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExternalProcessRepository extends JpaRepository<ExternalProcess, Long> {

  Optional<ExternalProcess> findByProcessName(String processName);
}
