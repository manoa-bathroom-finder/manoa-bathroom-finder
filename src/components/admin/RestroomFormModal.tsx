'use client';

import { useEffect, useState } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { UH_MANOA_BUILDINGS } from '@/types/admin';
import { AdminRestroom, RestroomFormValues } from '@/types/admin';

interface RestroomFormModalProps {
  show: boolean;
  editingRestroom: AdminRestroom | null;
  onHide: () => void;
  onSave: (values: RestroomFormValues) => void;
}

const AMENITY_OPTIONS = [
  'ADA Accessible',
  'Baby Changing Station',
  'Touchless Faucets',
  'Single Occupancy Lock',
  'Menstrual Product Dispenser',
];

export default function RestroomFormModal({
  show,
  editingRestroom,
  onHide,
  onSave,
}: RestroomFormModalProps) {
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('1');
  const [roomNumber, setRoomNumber] = useState('');
  const [type, setType] = useState<AdminRestroom['type']>('Multi-Stall (Men & Women)');
  const [stallCount, setStallCount] = useState(4);
  const [lastRenovated, setLastRenovated] = useState('');
  const [isAccessible, setIsAccessible] = useState(true);
  const [amenities, setAmenities] = useState<string[]>(['ADA Accessible']);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingRestroom) {
      setBuilding(editingRestroom.building);
      setFloor(editingRestroom.floor);
      setRoomNumber(editingRestroom.roomNumber);
      setType(editingRestroom.type);
      setStallCount(editingRestroom.stallCount);
      setLastRenovated(editingRestroom.lastRenovated ? String(editingRestroom.lastRenovated) : '');
      setIsAccessible(editingRestroom.isAccessible);
      setAmenities(editingRestroom.amenities);
      setNotes(editingRestroom.notes);
    } else {
      setBuilding('');
      setFloor('1');
      setRoomNumber('');
      setType('Multi-Stall (Men & Women)');
      setStallCount(4);
      setLastRenovated('');
      setIsAccessible(true);
      setAmenities(['ADA Accessible']);
      setNotes('');
    }
  }, [editingRestroom, show]);

  const toggleAmenity = (item: string) => {
    setAmenities((prev) => {
      const updated = prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item];
      if (item === 'ADA Accessible') {
        setIsAccessible(updated.includes('ADA Accessible'));
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!building.trim()) return;

    onSave({
      id: editingRestroom?.id,
      building: building.trim(),
      floor: floor.trim() || '1',
      roomNumber: roomNumber.trim(),
      type,
      stallCount: Number(stallCount) || 1,
      lastRenovated: lastRenovated.trim(),
      isAccessible,
      amenities,
      notes: notes.trim(),
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title className="fs-5 fw-bold">
            <i className="fa-solid fa-restroom me-2 text-info" />
            {editingRestroom ? `Edit Restroom: ${editingRestroom.building}` : 'Register New Campus Restroom'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          <Row className="g-3">
            <Col md={6}>
              <Form.Label className="fw-semibold small">
                Campus Building <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                list="uh-buildings-list"
                placeholder="e.g., Hamilton Library"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                required
              />
              <datalist id="uh-buildings-list">
                {UH_MANOA_BUILDINGS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </Col>

            <Col md={3}>
              <Form.Label className="fw-semibold small">
                Floor <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., 2 or B1"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                required
              />
            </Col>

            <Col md={3}>
              <Form.Label className="fw-semibold small">Room Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., 204"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
            </Col>

            <Col md={6}>
              <Form.Label className="fw-semibold small">Restroom Type</Form.Label>
              <Form.Select
                value={type}
                onChange={(e) => setType(e.target.value as AdminRestroom['type'])}
              >
                <option value="Multi-Stall (Men & Women)">Multi-Stall (Men &amp; Women)</option>
                <option value="All-Gender / Single-Stall">All-Gender / Single-Stall</option>
                <option value="Men">Men&apos;s Only</option>
                <option value="Women">Women&apos;s Only</option>
              </Form.Select>
            </Col>

            <Col md={3}>
              <Form.Label className="fw-semibold small">Stall Count</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={30}
                value={stallCount}
                onChange={(e) => setStallCount(Number(e.target.value))}
              />
            </Col>

            <Col md={3}>
              <Form.Label className="fw-semibold small">Last Renovated (Year)</Form.Label>
              <Form.Control
                type="number"
                min={1960}
                max={2026}
                placeholder="e.g., 2023"
                value={lastRenovated}
                onChange={(e) => setLastRenovated(e.target.value)}
              />
            </Col>

            <Col xs={12}>
              <Form.Label className="fw-semibold small d-block">Accessibility &amp; Amenities</Form.Label>
              <div className="d-flex flex-wrap gap-3 bg-light p-3 rounded border">
                {AMENITY_OPTIONS.map((item) => (
                  <Form.Check
                    key={item}
                    type="checkbox"
                    id={`amenity-${item}`}
                    label={item}
                    checked={amenities.includes(item)}
                    onChange={() => toggleAmenity(item)}
                  />
                ))}
              </div>
            </Col>

            <Col xs={12}>
              <Form.Label className="fw-semibold small">Wayfinding / Admin Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Landmark directions, elevator proximity, or keycode notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" className="btn-brand-teal text-white fw-semibold">
            <i className="fa-solid fa-check me-1" />
            {editingRestroom ? 'Save Changes' : 'Add Restroom'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}