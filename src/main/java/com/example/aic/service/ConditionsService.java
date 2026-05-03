package com.example.aic.service;

import com.example.aic.dto.ConditionsDTO;
import com.example.aic.model.Conditions;
import com.example.aic.model.User;
import com.example.aic.model.Person;
import com.example.aic.model.GuestContactInfo;
import com.example.aic.repository.ConditionsRepository;
import com.example.aic.repository.MassifRepository;
import com.example.aic.repository.RegionRepository;
import com.example.aic.model.ConditionImage;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Service
public class ConditionsService {

    @Autowired
    private ConditionsRepository conditionsRepository;

    @Autowired
    private RegionRepository regionRepository;

    @Autowired
    private MassifRepository massifRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Transactional(readOnly = true)
    public Page<ConditionsDTO> getAllConditions(Pageable pageable) {
        return conditionsRepository.findByStatus(Conditions.Status.VALIDATED, pageable)
                .map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public Page<ConditionsDTO> getPendingConditions(Pageable pageable) {
        return conditionsRepository.findByStatus(Conditions.Status.PENDING, pageable)
                .map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public ConditionsDTO getConditionsById(Integer id) {
        Conditions conditions = conditionsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conditions not found with id: " + id));
        return convertToDto(conditions);
    }

    @Transactional(readOnly = true)
    public Page<ConditionsDTO> search(String title, List<Integer> regionIds, List<Integer> massifIds,
            java.time.LocalDate startDate, java.time.LocalDate endDate,
            Double minTemperature, Double maxTemperature,
            Integer minWindSpeed, Integer maxWindSpeed,
            List<String> windDirections, List<String> visibilities,
            Integer minSnowDepth, Integer maxSnowDepth,
            Pageable pageable) {
        return conditionsRepository.findAll(com.example.aic.repository.specification.ConditionsSpecification.filterBy(
                title, regionIds, massifIds, startDate, endDate, 
                minTemperature, maxTemperature, minWindSpeed, maxWindSpeed,
                windDirections, visibilities, minSnowDepth, maxSnowDepth,
                Conditions.Status.VALIDATED), pageable)
                .map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public List<ConditionsDTO> searchAll(String title, List<Integer> regionIds, List<Integer> massifIds,
            java.time.LocalDate startDate, java.time.LocalDate endDate,
            Double minTemperature, Double maxTemperature,
            Integer minWindSpeed, Integer maxWindSpeed,
            List<String> windDirections, List<String> visibilities,
            Integer minSnowDepth, Integer maxSnowDepth) {
        return conditionsRepository.findAll(com.example.aic.repository.specification.ConditionsSpecification.filterBy(
                title, regionIds, massifIds, startDate, endDate,
                minTemperature, maxTemperature, minWindSpeed, maxWindSpeed,
                windDirections, visibilities, minSnowDepth, maxSnowDepth,
                Conditions.Status.VALIDATED)).stream()
                .map(this::convertToDto)
                .collect(java.util.stream.Collectors.toList());
    }

    public ConditionsDTO createConditions(ConditionsDTO dto, User user) {
        Conditions conditions = modelMapper.map(dto, Conditions.class);
        if (user != null) {
            conditions.setVisitor(user);
            conditions.setGuestContactInfo(null);
        } else {
            if (dto.getGuestContactInfo() == null || 
                dto.getGuestContactInfo().getFirstName() == null || dto.getGuestContactInfo().getFirstName().trim().isEmpty() ||
                dto.getGuestContactInfo().getLastName() == null || dto.getGuestContactInfo().getLastName().trim().isEmpty() ||
                dto.getGuestContactInfo().getEmail() == null || dto.getGuestContactInfo().getEmail().trim().isEmpty() ||
                dto.getGuestContactInfo().getPhone() == null || dto.getGuestContactInfo().getPhone().trim().isEmpty()) {
                throw new RuntimeException("Datele de contact (nume, prenume, email, telefon) sunt obligatorii pentru vizitatori.");
            }
            
            GuestContactInfo guestInfo = new GuestContactInfo();
            Person person = new Person();
            person.setFirstName(dto.getGuestContactInfo().getFirstName());
            person.setLastName(dto.getGuestContactInfo().getLastName());
            person.setPhone(dto.getGuestContactInfo().getPhone());
            guestInfo.setPerson(person);
            guestInfo.setEmail(dto.getGuestContactInfo().getEmail());
            conditions.setGuestContactInfo(guestInfo);
        }
        conditions.setStatus(Conditions.Status.PENDING);

        if (dto.getRegionId() != null) {
            conditions.setRegion(regionRepository.findById(dto.getRegionId()).orElse(null));
        }
        if (dto.getMassifId() != null) {
            conditions.setMassif(massifRepository.findById(dto.getMassifId()).orElse(null));
        }

        Conditions saved = conditionsRepository.save(conditions);
        return convertToDto(saved);
    }

    @Transactional
    public ConditionsDTO createWithImages(ConditionsDTO dto, org.springframework.web.multipart.MultipartFile[] files, User user) {
        ConditionsDTO created = createConditions(dto, user);
        Conditions conditions = conditionsRepository.findById(created.getId()).orElseThrow();

        if (files != null && files.length > 0) {
            int processed = 0;
            for (org.springframework.web.multipart.MultipartFile file : files) {
                if (file.isEmpty()) continue;
                if (processed >= 4) break;
                
                String fileName = fileStorageService.storeFile(file, "conditions");
                String fileUrl = "/uploads/conditions/" + fileName;
                
                ConditionImage condImage = new ConditionImage();
                condImage.setConditions(conditions);
                condImage.setImageUrl(fileUrl);
                conditions.getImages().add(condImage);
                processed++;
            }
            conditionsRepository.save(conditions);
        }

        return convertToDto(conditions);
    }

    @Autowired
    private FileStorageService fileStorageService;

    private ConditionsDTO convertToDto(Conditions conditions) {
        ConditionsDTO dto = modelMapper.map(conditions, ConditionsDTO.class);
        if (conditions.getRegion() != null) {
            dto.setRegionId(conditions.getRegion().getId());
            dto.setRegionName(conditions.getRegion().getName());
        }
        if (conditions.getMassif() != null) {
            dto.setMassifId(conditions.getMassif().getId());
            dto.setMassifName(conditions.getMassif().getName());
        }
        if (conditions.getVisitor() != null) {
            dto.setVisitorId(conditions.getVisitor().getId());
            dto.setGuestContactInfo(null);
        } else if (conditions.getGuestContactInfo() != null) {
            com.example.aic.dto.GuestContactInfoDTO guestDto = new com.example.aic.dto.GuestContactInfoDTO();
            guestDto.setId(conditions.getGuestContactInfo().getId());
            if (conditions.getGuestContactInfo().getPerson() != null) {
                guestDto.setFirstName(conditions.getGuestContactInfo().getPerson().getFirstName());
                guestDto.setLastName(conditions.getGuestContactInfo().getPerson().getLastName());
                guestDto.setEmail(conditions.getGuestContactInfo().getEmail());
                guestDto.setPhone(conditions.getGuestContactInfo().getPerson().getPhone());
            }
            dto.setGuestContactInfo(guestDto);
        }
        
        if (conditions.getImages() != null) {
            dto.setImageUrls(conditions.getImages().stream()
                    .map(ConditionImage::getImageUrl)
                    .collect(java.util.stream.Collectors.toList()));
        }
        
        return dto;
    }

    public void deleteConditions(Integer id) {
        conditionsRepository.deleteById(id);
    }

    public void validate(Integer id) {
        Conditions conditions = conditionsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conditions not found with id: " + id));
        conditions.setStatus(Conditions.Status.VALIDATED);
        conditionsRepository.save(conditions);
    }

    public ConditionsDTO updateConditions(Integer id, ConditionsDTO dto) {
        Conditions conditions = conditionsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conditions not found with id: " + id));

        conditions.setTitle(dto.getTitle());
        conditions.setDate(dto.getDate());
        conditions.setDescription(dto.getDescription());
        conditions.setTemperature(dto.getTemperature());
        conditions.setWindSpeed(dto.getWindSpeed());
        conditions.setWindDirection(dto.getWindDirection());
        conditions.setVisibility(dto.getVisibility());
        conditions.setSnowDepth(dto.getSnowDepth());

        if (dto.getRegionId() != null) {
            conditions.setRegion(regionRepository.findById(dto.getRegionId()).orElse(null));
        }
        if (dto.getMassifId() != null) {
            conditions.setMassif(massifRepository.findById(dto.getMassifId()).orElse(null));
        }

        // Handle GuestContactInfo update if it exists
        if (dto.getGuestContactInfo() != null && conditions.getGuestContactInfo() != null) {
            GuestContactInfo guestInfo = conditions.getGuestContactInfo();
            if (guestInfo.getPerson() == null) guestInfo.setPerson(new Person());
            guestInfo.getPerson().setFirstName(dto.getGuestContactInfo().getFirstName());
            guestInfo.getPerson().setLastName(dto.getGuestContactInfo().getLastName());
            guestInfo.setEmail(dto.getGuestContactInfo().getEmail());
            guestInfo.getPerson().setPhone(dto.getGuestContactInfo().getPhone());
        }

        Conditions saved = conditionsRepository.save(conditions);
        return convertToDto(saved);
    }
}
