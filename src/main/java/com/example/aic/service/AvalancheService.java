package com.example.aic.service;

import com.example.aic.dto.AvalancheDTO;
import com.example.aic.model.*;
import com.example.aic.repository.*;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AvalancheService {

    @Autowired
    private AvalancheRepository avalancheRepository;

    @Autowired
    private MassifRepository massifRepository;

    @Autowired
    private AvalancheTypeRepository typeRepository;

    @Autowired
    private AvalancheCauseRepository causeRepository;

    @Autowired
    private OrientationRepository orientationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private NotificationPublisher notificationPublisher;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private AvalancheImageRepository avalancheImageRepository;

    @Transactional(readOnly = true)
    public Page<AvalancheDTO> getAllAvalanches(Pageable pageable) {
        return avalancheRepository.findAll(pageable)
                .map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public Page<AvalancheDTO> getValidatedAvalanches(Pageable pageable) {
        return avalancheRepository.findByStatus(Avalanche.Status.VALIDATED, pageable)
                .map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public AvalancheDTO getAvalancheById(Integer id) {
        Avalanche avalanche = avalancheRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Avalanche not found with id: " + id));
        return convertToDto(avalanche);
    }

    @Transactional(readOnly = true)
    public Page<AvalancheDTO> search(
            String title, List<Integer> massifIds, List<Integer> regionIds, List<Integer> typeIds, List<Integer> causeIds,
            List<Integer> orientationIds, java.time.LocalDate startDate, java.time.LocalDate endDate,
            Integer minAltitude, Integer maxAltitude, Integer minSlope,
            Integer minTrackLength, Integer maxTrackLength,
            Integer minCrownDepth, Integer maxCrownDepth,
            Integer minCrownWidth, Integer maxCrownWidth,
            Integer minVerticalDrop, Integer maxVerticalDrop,
            List<String> relativeSize, 
            String activity,
            Boolean hasCaught, Boolean hasPartially, Boolean hasFully, 
            Boolean hasInjured, Boolean hasKilled, Boolean hasMaterial,
            String status, Pageable pageable) {
        return avalancheRepository.findAll(com.example.aic.repository.specification.AvalancheSpecification.filterBy(
                title, massifIds, regionIds, typeIds, causeIds, orientationIds, startDate, endDate,
                minAltitude, maxAltitude, minSlope,
                minTrackLength, maxTrackLength,
                minCrownDepth, maxCrownDepth,
                minCrownWidth, maxCrownWidth,
                minVerticalDrop, maxVerticalDrop,
                relativeSize, activity,
                hasCaught, hasPartially, hasFully, hasInjured, hasKilled, hasMaterial,
                status), pageable)
                .map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public List<AvalancheDTO> searchAll(
            String title, List<Integer> massifIds, List<Integer> regionIds, List<Integer> typeIds, List<Integer> causeIds,
            List<Integer> orientationIds, java.time.LocalDate startDate, java.time.LocalDate endDate,
            Integer minAltitude, Integer maxAltitude, Integer minSlope,
            Integer minTrackLength, Integer maxTrackLength,
            Integer minCrownDepth, Integer maxCrownDepth,
            Integer minCrownWidth, Integer maxCrownWidth,
            Integer minVerticalDrop, Integer maxVerticalDrop,
            List<String> relativeSize,
            String activity,
            Boolean hasCaught, Boolean hasPartially, Boolean hasFully,
            Boolean hasInjured, Boolean hasKilled, Boolean hasMaterial,
            String status) {
        return avalancheRepository.findAll(com.example.aic.repository.specification.AvalancheSpecification.filterBy(
                title, massifIds, regionIds, typeIds, causeIds, orientationIds, startDate, endDate,
                minAltitude, maxAltitude, minSlope,
                minTrackLength, maxTrackLength,
                minCrownDepth, maxCrownDepth,
                minCrownWidth, maxCrownWidth,
                minVerticalDrop, maxVerticalDrop,
                relativeSize, activity,
                hasCaught, hasPartially, hasFully, hasInjured, hasKilled, hasMaterial,
                status)).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AvalancheDTO createAvalanche(AvalancheDTO dto, User user) {
        Avalanche avalanche = modelMapper.map(dto, Avalanche.class);
        if (user != null) {
            avalanche.setVisitor(user);
            avalanche.setGuestContactInfo(null);
            
            // Validation logic for status
            String roleName = (user.getRole() != null) ? user.getRole().getName().toUpperCase() : "";
            if (roleName.contains("ADMIN") || roleName.contains("EXPERT")) {
                avalanche.setStatus(Avalanche.Status.VALIDATED);
            } else {
                avalanche.setStatus(Avalanche.Status.PENDING);
            }
        } else {
            // Guest users always have PENDING status and MUST provide contact info
            avalanche.setStatus(Avalanche.Status.PENDING);
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
            avalanche.setGuestContactInfo(guestInfo);
        }

        // Set relations
        if (dto.getMassifId() != null) {
            avalanche.setMassif(massifRepository.findById(dto.getMassifId()).orElse(null));
        }
        if (dto.getTypeId() != null) {
            avalanche.setType(typeRepository.findById(dto.getTypeId()).orElse(null));
        }
        if (dto.getCauseId() != null) {
            avalanche.setCause(causeRepository.findById(dto.getCauseId()).orElse(null));
        }
        if (dto.getOrientationId() != null) {
            avalanche.setOrientation(orientationRepository.findById(dto.getOrientationId()).orElse(null));
        }

        // Handle nested entities
        if (avalanche.getTechnicalDetails() != null) {
            avalanche.getTechnicalDetails().setAvalanche(avalanche);
        }
        if (avalanche.getDamagesAndVictims() != null) {
            avalanche.getDamagesAndVictims().setAvalanche(avalanche);
        }

        Avalanche saved = avalancheRepository.save(avalanche);
        return convertToDto(saved);
    }

    @Transactional
    public AvalancheDTO createWithImages(AvalancheDTO dto, MultipartFile[] files, User user) {
        // 1. Create the avalanche (part of the same transaction)
        AvalancheDTO created = createAvalanche(dto, user);

        // 2. Upload images (if any)
        if (files != null && files.length > 0) {
            uploadImages(created.getId(), files);
        }

        // 3. Send notifications ONLY after successful creation and image validation
        String authorName = (user != null) ? user.getUsername() : "Vizitator Anonim";
        if ("VALIDATED".equalsIgnoreCase(created.getStatus())) {
            notificationPublisher.sendAvalancheValidatedEvent(
                    "O nouă avalanșă a fost publicată direct de utilizatorul: " + authorName);
            Avalanche entity = avalancheRepository.findById(created.getId()).orElse(null);
            if (entity != null) {
                notificationPublisher.sendAvalancheEmailNotification(entity);
            }
        } else {
            notificationPublisher.sendAvalancheCreatedEvent(
                    "O nouă avalanșă a fost adăugată de " + authorName + " și necesită validare!");
        }

        // 4. Return the fully populated DTO
        return getAvalancheById(created.getId());
    }

    @Transactional
    public AvalancheDTO validateAvalanche(Integer id) {
        Avalanche avalanche = avalancheRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Avalanche not found"));
        avalanche.setStatus(Avalanche.Status.VALIDATED);
        Avalanche saved = avalancheRepository.save(avalanche);

        notificationPublisher
                .sendAvalancheValidatedEvent("Avalanșa cu ID-ul " + id + " a fost validată de către un admin!");
        notificationPublisher.sendAvalancheEmailNotification(saved);

        return convertToDto(saved);
    }

    private AvalancheDTO convertToDto(Avalanche avalanche) {
        AvalancheDTO dto = modelMapper.map(avalanche, AvalancheDTO.class);
        if (avalanche.getMassif() != null) {
            dto.setMassifId(avalanche.getMassif().getId());
            dto.setMassifName(avalanche.getMassif().getName());
        }
        if (avalanche.getType() != null)
            dto.setTypeId(avalanche.getType().getId());
        if (avalanche.getCause() != null)
            dto.setCauseId(avalanche.getCause().getId());
        if (avalanche.getOrientation() != null)
            dto.setOrientationId(avalanche.getOrientation().getId());
        if (avalanche.getVisitor() != null)
            dto.setVisitorId(avalanche.getVisitor().getId());

        if (avalanche.getImages() != null) {
            int imageCount = avalanche.getImages().size();
            System.out.println("DTO Conversion - ID: " + avalanche.getId() + ", Status: " + avalanche.getStatus()
                    + ", Images found: " + imageCount);
            dto.setImageUrls(avalanche.getImages().stream()
                    .map(AvalancheImage::getImageUrl)
                    .collect(Collectors.toList()));
        } else {
            System.out.println("DTO Conversion - ID: " + avalanche.getId() + ", Status: " + avalanche.getStatus()
                    + ", Images collection is NULL");
        }

        return dto;
    }

    @Transactional
    public List<AvalancheImage> uploadImages(Integer avalancheId, MultipartFile[] files) {
        Avalanche avalanche = avalancheRepository.findById(avalancheId)
                .orElseThrow(() -> new RuntimeException("Avalanche not found with id: " + avalancheId));

        int currentImageCount = avalanche.getImages() != null ? avalanche.getImages().size() : 0;
        if (currentImageCount + files.length > 4) {
            throw new RuntimeException("An avalanche can have a maximum of 4 images.");
        }

        List<AvalancheImage> savedImages = new java.util.ArrayList<>();
        for (MultipartFile file : files) {
            String fileName = fileStorageService.storeFile(file, "avalanches");
            String fileUrl = "/uploads/avalanches/" + fileName;

            AvalancheImage image = new AvalancheImage();
            image.setAvalanche(avalanche);
            image.setImageUrl(fileUrl);

            savedImages.add(avalancheImageRepository.save(image));
        }

        return savedImages;
    }

    @Transactional
    public AvalancheDTO updateAvalanche(Integer id, AvalancheDTO dto) {
        Avalanche avalanche = avalancheRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Avalanche not found with id: " + id));

        avalanche.setTitle(dto.getTitle());
        avalanche.setDate(dto.getDate());
        avalanche.setLatitude(dto.getLatitude());
        avalanche.setLongitude(dto.getLongitude());
        avalanche.setZone(dto.getZone());
        avalanche.setSize(dto.getSize());
        avalanche.setSafetyEquipment(dto.getSafetyEquipment());
        avalanche.setLink(dto.getLink());
        avalanche.setEventTime(dto.getEventTime());
        avalanche.setActivity(dto.getActivity());

        if (dto.getMassifId() != null) {
            avalanche.setMassif(massifRepository.findById(dto.getMassifId()).orElse(null));
        } else {
            avalanche.setMassif(null);
        }
        
        if (dto.getTypeId() != null) {
            avalanche.setType(typeRepository.findById(dto.getTypeId()).orElse(null));
        } else {
            avalanche.setType(null);
        }
        
        if (dto.getCauseId() != null) {
            avalanche.setCause(causeRepository.findById(dto.getCauseId()).orElse(null));
        } else {
            avalanche.setCause(null);
        }
        
        if (dto.getOrientationId() != null) {
            avalanche.setOrientation(orientationRepository.findById(dto.getOrientationId()).orElse(null));
        } else {
            avalanche.setOrientation(null);
        }

        // Handle nested updates
        if (dto.getTechnicalDetails() != null) {
            TechnicalDetails td = avalanche.getTechnicalDetails();
            if (td == null) {
                td = new TechnicalDetails();
                td.setAvalanche(avalanche);
            }
            modelMapper.map(dto.getTechnicalDetails(), td);
            avalanche.setTechnicalDetails(td);
        }

        if (dto.getDamagesAndVictims() != null) {
            DamagesAndVictims dv = avalanche.getDamagesAndVictims();
            if (dv == null) {
                dv = new DamagesAndVictims();
                dv.setAvalanche(avalanche);
            }
            modelMapper.map(dto.getDamagesAndVictims(), dv);
            avalanche.setDamagesAndVictims(dv);
        }

        Avalanche saved = avalancheRepository.save(avalanche);
        return convertToDto(saved);
    }

    @Transactional
    public void deleteAvalanche(Integer id) {
        Avalanche avalanche = avalancheRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Avalanche not found with id: " + id));

        // Delete physical images
        if (avalanche.getImages() != null) {
            for (AvalancheImage image : avalanche.getImages()) {
                fileStorageService.deleteFile(image.getImageUrl());
            }
        }

        avalancheRepository.delete(avalanche);
    }

    @Transactional
    public void deleteImageByUrl(Integer avalancheId, String imageUrl) {
        Avalanche avalanche = avalancheRepository.findById(avalancheId)
                .orElseThrow(() -> new RuntimeException("Avalanche not found"));

        if (avalanche.getImages() != null) {
            AvalancheImage imageToDelete = avalanche.getImages().stream()
                    .filter(img -> img.getImageUrl().equals(imageUrl))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Image not found in this avalanche"));

            fileStorageService.deleteFile(imageToDelete.getImageUrl());
            avalanche.getImages().remove(imageToDelete);
            avalancheImageRepository.delete(imageToDelete);
            avalancheRepository.save(avalanche);
        }
    }
}
