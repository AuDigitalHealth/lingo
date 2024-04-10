package com.csiro.eclrefset.model.refsetqueryresponse;

public class Item {

    boolean active;
    String moduleId;
    boolean released;
    String memberId;
    String refsetId;
    AdditionalFields additionalFields;
    ReferencedComponent referencedComponent;
    
    public boolean isActive() {
        return active;
    }
    public String getModuleId() {
        return moduleId;
    }
    public boolean isReleased() {
        return released;
    }
    public String getMemberId() {
        return memberId;
    }
    public String getRefsetId() {
        return refsetId;
    }
    public AdditionalFields getAdditionalFields() {
        return additionalFields;
    }
    public ReferencedComponent getReferencedComponent() {
        return referencedComponent;
    }
    public void setActive(boolean active) {
        this.active = active;
    }
    public void setModuleId(String moduleId) {
        this.moduleId = moduleId;
    }
    public void setReleased(boolean released) {
        this.released = released;
    }
    public void setMemberId(String memberId) {
        this.memberId = memberId;
    }
    public void setRefsetId(String refsetId) {
        this.refsetId = refsetId;
    }
    public void setAdditionalFields(AdditionalFields additionalFields) {
        this.additionalFields = additionalFields;
    }
    public void setReferencedComponent(ReferencedComponent referencedComponent) {
        this.referencedComponent = referencedComponent;
    }

}
