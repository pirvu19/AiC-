package com.example.aic.config;

import com.example.aic.model.Person;
import com.example.aic.model.Role;
import com.example.aic.model.User;
import com.example.aic.repository.RoleRepository;
import com.example.aic.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Initialize Roles (Matching your exact database names)
        createRoleIfNotFound("admin");
        createRoleIfNotFound("expert");
        createRoleIfNotFound("ADMIN_UTILIZATORI");
        createRoleIfNotFound("user");
        createRoleIfNotFound("DATA_ENGINEER");
        createRoleIfNotFound("REVIEWER");
        createRoleIfNotFound("contributor");

        // 2. Initialize or Repair Users (Ensures everyone has a Person profile)
        createOrRepairUser("admin1", "admin1@example.com", "admin1", "admin", "Admin", "Unu", "0722111222");
        createOrRepairUser("admin", "admin@example.com", "admin", "ADMIN_UTILIZATORI", "Admin", "Utilizatori",
                "0722333444");
        createOrRepairUser("expert", "expert@example.com", "expert", "expert", "Expert", "Principal", "0722555666");
        createOrRepairUser("deliaa", "deliaa@example.com", "deliaa", "REVIEWER", "Delia", "Reviewer", "0722777888");
        createOrRepairUser("pirvu", "pirvu@example.com", "pirvu", "DATA_ENGINEER", "Pirvu", "DataEngineer",
                "0722999000");
    }

    private void createRoleIfNotFound(String roleName) {
        if (roleRepository.findByName(roleName).isEmpty()) {
            roleRepository.save(new Role(null, roleName));
        }
    }

    private void createOrRepairUser(String username, String email, String password, String roleName,
            String firstName, String lastName, String phone) {
        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null) {
            // Create new user if not exists
            user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setMustChangePassword(false);

            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            user.setRole(role);
        }

        // AUTO-REPAIR: If user exists but has no Person record, create one
        if (user.getPerson() == null) {
            Person person = new Person();
            person.setFirstName(firstName);
            person.setLastName(lastName);
            person.setPhone(phone);
            user.setPerson(person);

            userRepository.save(user);
        }
    }
}
